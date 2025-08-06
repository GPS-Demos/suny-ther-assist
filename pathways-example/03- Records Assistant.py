# Copyright 2024 Google, LLC. This software is provided as-is,
# without warranty or representation for any use or purpose. Your
# use of it is subject to your agreement with Google.

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#    http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from vertexai.generative_models import GenerativeModel, Part, SafetySetting
import vertexai

from google.cloud import bigquery as bq

import streamlit as st

################################# GenAI configurations specific to NL to SQL ######################

# configuration parameters
generation_config = {
    "max_output_tokens": 8192,
    "temperature": 0,
    "top_p": 0.95,
}

# safety setting
safety_settings = [
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold=SafetySetting.HarmBlockThreshold.BLOCK_ONLY_HIGH
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold=SafetySetting.HarmBlockThreshold.BLOCK_ONLY_HIGH
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold=SafetySetting.HarmBlockThreshold.BLOCK_ONLY_HIGH
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold=SafetySetting.HarmBlockThreshold.BLOCK_ONLY_HIGH
    ),
]

################################# GCS / BQ Storage configurations ##############################

BQ_DIAGNOSIS_TABLE_ID = 'gen-sch.gensch_evaluations.pathways_diagnosis_evaluations'
BQ_PATHWAY_CONVERSATIONS_TABLE_ID = 'gen-sch.gensch_evaluations.pathways_conversation_evaluations'
bq_client = bq.Client(project='gen-sch')

# short tables schemas used for filtering
diagnosis_schema = """
    {
        "field": "preferred_diagnosis", 
        "type": "STRING", 
        "description": "Preferred diagnosis"
    },
    {
        "field": "chosen_diagnosis", 
        "type": "STRING", 
        "description": "Chosen diagnosis from Gemini proposals"
    },
    {
        "field": "score", 
        "type": "INTEGER", 
        "description": "Conversation quality score"
    },
    {
        "field": "in_short_list", 
        "type": "BOOLEAN", 
        "description": "True if the preferred diagnosis in the short list proposed by Gemini"
    },
    {
        "field": "differential_diagnosis_missing", 
        "type": "BOOLEAN", 
        "description": "True if differential diagnosis is missing from Gemini's short list"
    }
]"""

pathways_schema = """
    {
        "field": "pathway", 
        "type": "STRING", 
        "description": "Pathway"
    },
    {
        "field": "score", 
        "type": "INTEGER", 
        "description": "Conversation quality score"
    },
    {
        "field": "risky", 
        "type": "BOOLEAN", 
        "description": "True if the conversation includes anything dangerous for the patient"
    },
    {
        "field": "topics", 
        "type": "STRING", 
        "description": "Topics discussed"
    },
    {
        "field": "parent_id", 
        "type": "STRING", 
        "description": "Id of the parent conversation. Set to '-1' for full conversation"
    }
]"""

system_instructions = """
You are specialist of translating user query from plain English to SQL query using the table name and schema indicated here:
table name = {0}

diagnosis_schema = {1}

Generate the SQL query corresponding to the user question. 
Always use low cased version of the STRING filters entered by the user.
Always compare filter values with the low cased version of the table entries used for filtering.
For filtering based on BOOLEAN or INT64 data, do not change anything.
When user mentions some topics, consider them as topics, not patway.
"""

###########################################################################################
@st.cache_data
def filter_to_query(query: str, system_instructions: str) -> str:
    """
    Use Gemini to generate the query using filters
    :param query: query expressed in plain English
    :param system_instructions: system instructions
    :return: SQL query as string object
    """

    model = GenerativeModel(
        "gemini-1.5-flash-002",
        system_instruction=[system_instructions]
    )
    response = model.generate_content(
        [query],
        generation_config=generation_config,
        safety_settings=safety_settings,
        stream=False
    )

    return response.text

@st.cache_data
def run_query(query: str) -> list:
    """
    Run query
    :param query: SQL query as string object
    :return: rows as list of dictionaries
    """
    if query.startswith('```sql\n'):
        query = query[7:]
    if query.endswith('```\n') or query.endswith('```'):
        query = query[:-4]
    query_job = bq_client.query(query)
    rows_raw = query_job.result()
    rows = [dict(row) for row in rows_raw]
    return rows

@st.cache_data
def recorded_conversation(recorded_conversation: list) -> None:
    """
    Replay the conversation passed as parameter.
    :param recorded_conversation: recorded conversation as list of dictionaries
    :return: None
    """

    with st.container(): 
        for m in recorded_conversation:
            with st.chat_message(m["role"]):
                st.markdown(m["content"])

##########################################################
# APPLICATION USER INTERFACE AND BACKBONE

st.title("Pathways Q&A evaluations v2.0")
st.subheader("Seattle Children Hospital")

logos_colums = st.columns(20)
logos_colums[0].image('./resources/sch-logo.gif', width=30)
logos_colums[1].image('./resources/gcp-logo.png', width=35)

st.error("""
This application is for internal testing only. Please, ignore any output 
generated by this application for answering patient-related medical questions. 
""")

st.subheader("Records")

st.markdown("""
Access the conversations records stored in the SCH database by filtering the entries.
"""
)

# select the kind of records that you want to retrieve
conversation_type = st.selectbox("Conversation type", options=["Diagnosis", "Pathways"])

# for Diagnosis
if conversation_type == "Diagnosis":

    system_instructions = system_instructions.format(
        BQ_DIAGNOSIS_TABLE_ID, diagnosis_schema
    )

    st.markdown("""Please use the text input to explain in plain English the records that you
    want to retrieve from the records. The list of filters that you can use are:\n
    - Preferred diagnosis: the diagnosis preferred by the physician (what Gemini should have proposed)
    - Chosen diagnosis: the diagnosis chosen from the short list proposed by Gemini
    - Score: a threshold for the score
    - Only records where Gemini includes the preferred diagnosis in its short list 
    - Only the records with missing differential diagnosis from Gemini's short list
    """)

    if 'diagnosis_user_query' not in st.session_state:
        st.session_state['diagnosis_user_query'] = ''
    user_query = st.text_area("Diagnosis Records Query", value=st.session_state['diagnosis_user_query'])
    
    if user_query:
        st.session_state['diagnosis_user_query'] = user_query

        diagnosis_search_button = st.button(
            label="Search Diagnosis Records", disabled=not user_query
        )

        if 'diagnosis_rows' not in st.session_state:
            st.session_state['diagnosis_rows'] = None

        if diagnosis_search_button or st.session_state['diagnosis_rows']:
            sql_query = filter_to_query(user_query, system_instructions)
            st.write(sql_query)
            st.session_state['diagnosis_rows'] = run_query(sql_query)
            st.dataframe(st.session_state['diagnosis_rows'])

        if st.session_state['diagnosis_rows']:
            row_indexes = [i+1 for i in range(len(st.session_state['diagnosis_rows']))]
            selected_row = st.selectbox("Select Diagnosis conversation", options=row_indexes, index=None)
            show_conversation_button = st.button(label="Show Diagnosis conversation")

            if selected_row and show_conversation_button:
                recorded_conversation(st.session_state['diagnosis_rows'][selected_row-1]['conversation'])
            
# for Pathways
if conversation_type == "Pathways":

    system_instructions = system_instructions.format(
        BQ_PATHWAY_CONVERSATIONS_TABLE_ID, pathways_schema
    )

    st.markdown("""Please use the text input to explain in plain English the records that you
    want to retrieve from the records. The list of filters that you can use are:\n
    - Pathway: the pathway discussed in the conversation
    - Score: a threshold for the score
    - Topics: the topics discussed in the conversation
    - Only records where Gemini has indicated something risky for the patient
    - Full conversation or incremental ones
    """)

    if 'pathways_user_query' not in st.session_state:
        st.session_state['pathways_user_query'] = ''
    user_query = st.text_area("Pathways Records Query", value=st.session_state['pathways_user_query'])

    if user_query:
        st.session_state['pathways_user_query'] = user_query
    
        pathways_search_button = st.button(
            label="Search Pathways Records", disabled=not user_query
        )

        if 'pathways_rows' not in st.session_state:
            st.session_state['pathways_rows'] = None
        if pathways_search_button or st.session_state['pathways_rows']:
            sql_query = filter_to_query(user_query, system_instructions)
            st.write(sql_query)
            st.session_state['pathways_rows'] = run_query(sql_query)
            st.dataframe(st.session_state['pathways_rows'])

        if st.session_state['pathways_rows']:
            row_indexes = [i+1 for i in range(len(st.session_state['pathways_rows']))]
            selected_row = st.selectbox("Select Pathways conversation", options=row_indexes, index=None)
            show_conversation_button = st.button(label="Show Pathways conversation")

            if selected_row and show_conversation_button:
                recorded_conversation(st.session_state['pathways_rows'][selected_row-1]['conversation'])
