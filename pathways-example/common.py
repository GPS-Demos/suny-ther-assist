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

from vertexai.generative_models import GenerativeModel, Part, SafetySetting, GenerationConfig
import vertexai.preview.generative_models as generative_models
import vertexai

from google.cloud import bigquery as bq
from google.cloud import storage

import numpy as np

import streamlit as st

from collections import defaultdict
from typing import Dict, List
from datetime import datetime
import hashlib
import json
import pwd
import io
import os

PATHWAY_BUCKET_NAME = "pathways_pdf_reports_with_page_number"

################################# GenAI configurations #################################

# configuration parameters
generation_config = {
    "max_output_tokens": 8192,
    "temperature": 1,
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

###########################################################################################

def encrypted_id() -> str:
    """
    Create an encrypted id for user identification
    :return: encrypted id
    """
    m = hashlib.md5()
    user_name = pwd.getpwuid(os.getuid())[0]
    m.update(user_name.encode('utf-8'))
    return (str(int(m.hexdigest(), 16))[0:12])


def feedback_id(content: str) -> str:
    """
    Create an encrypted id for feedback
    :param content: feedback content
    :return: encrypted id
    """
    m = hashlib.md5()
    m.update(content.encode('utf-8'))
    return (str(int(m.hexdigest(), 16))[0:12])


def record_feedback(records: Dict, table_id: str) -> None:
    """
    Record the feedback
    :param records: dictionary with the feedback
    :param table_id: bigquery table id
    :return: None
    """
    bq_client = bq.Client()

    errors = bq_client.insert_rows_json(table_id, [records])
    if errors == []:
        st.success("Thanks for your feedback!")
        if records['score'] >= 3:
            st.balloons()
        else:
            st.snow()
    else:
        st.error(("Encountered errors while inserting rows: {}".format(errors)))


def create_table(table_id: str, schema: list) -> None:
    """
    Create BigQuery table using identifier and schema

    """
    bq_client = bq.Client()
    table = bq.Table(table_id, schema=schema)
    try:
        bq_client.create_table(table, )
    except:
        pass


def create_chat_session(
    message: str, persona: str, pathway: None
):
    """
    Create a new chat session
    :param message: message as string
    :param persona: persona
    :param pathway: pathway name
    :return: chat session
    """

    # model name
    model_name = "gemini-2.0-flash-001"

    # select the system prompt depending the persona
    system_instruction = st.session_state['prompts'][persona]['system_instruction']

    # enrich diagnosis system prompt
    if persona == "diagnosis":
        medatadata = st.session_state['metadata']["high_priority_pathways_symptoms"]
        system_instruction = system_instruction.format(medatadata)

    # select the prompt depending the persona
    elif persona == "pathway":
        medatadata = st.session_state['metadata'][pathway]
        system_instruction = system_instruction.format(medatadata)

    # init the model now the system instruction has been set
    model = GenerativeModel(
        model_name=model_name,
        generation_config=generation_config,
        safety_settings=safety_settings,
        system_instruction=[system_instruction]
    )

    # start the chat
    return model.start_chat(history=[])


def writing_assistant(key: str, persona: str, pathway: str=None) -> None:
    """
    Manage the conversation for the writing assistant.
    :param key: streamlit key to identify the UI element
    :param persona: the persona of the chatbot
    :param pathway: pathway title
    :return: None
    """

    # Init the conversation
    chat_input_container = st.container()
    with chat_input_container:
        message = st.chat_input("👋 Hello, How can I help you today?", key=f"{key}_input")

    main_chat_container = st.container(height=400)
    with main_chat_container:

        if message or (f'{key}_text_chat_history' in st.session_state and st.session_state[f'{key}_text_chat_history']):

            # init the chat history in the session state
            if f'{key}_text_chat_history' not in st.session_state or not st.session_state[f'{key}_text_chat_history']:
                chat_session = create_chat_session(message, persona, pathway)
                st.session_state[f'{key}_text_chat_history'] = []
                st.session_state['incremental_index'] = 0

                # if the persona is pathway, the chat needs the pathway report
                # and the prompt
                if persona == "pathway":
                    # send the first message with the prompt and the document attached
                    prompt = st.session_state['prompts'][persona]['prompt_template']
                    uri = f"gs://{PATHWAY_BUCKET_NAME}/{pathway}.pdf"
                    document = Part.from_uri(mime_type="application/pdf", uri=uri)
                    chat_session.send_message([document, message])

                st.session_state[f'{key}_text_chat_session'] = chat_session

            # Display chat messages from history on app rerun
            for m in st.session_state[f'{key}_text_chat_history']:
                with st.chat_message(m["role"]):
                    st.markdown(m["content"])

            # Add user message to chat history
            if message:
                st.session_state[f'{key}_text_chat_history'].append({"role": "user", "content": message})

                # Display user message in chat message container
                with st.chat_message("user"):
                    st.markdown(message)
                with st.chat_message("assistant"):
                    current_chat_session = st.session_state[f'{key}_text_chat_session']
                    responses = st.session_state[f'{key}_text_chat_session'].send_message(message, stream=True)
                    texts = [r.text for r in responses]
                    full_response = ""
                    for t in texts:
                        full_response += ' ' + t
                    st.write_stream(texts)
                    st.session_state[f'{key}_text_chat_history'].append(
                        {"role": "assistant", "content": full_response}
                    )
