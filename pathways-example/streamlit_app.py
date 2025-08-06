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

from google.cloud import storage
import vertexai

import streamlit as st
import time
import json

################################# GCS Storage configurations ##############################

METADATA_BUCKET_NAME = "pathways_metadata"

# init a single storage client
storage_client = storage.Client()

# init vertex ai
vertexai.init(project="gen-sch", location="us-central1")

###########################################################################################

pg = st.navigation(
    [
        st.Page("Welcome.py"),
        st.Page("01- Pathway Choice Assistant.py"), 
        st.Page("02- Pathway Assistant.py"),
        st.Page("03- Records Assistant.py")
    ]
)

@st.cache_resource()
def load_metatdata() -> dict:
    """
    Load the metadata library in the Streamlit session state"
    """
    bucket = storage_client.bucket(METADATA_BUCKET_NAME)
    metadata_dict = {}
    for blob in bucket.list_blobs():
        pathway_name = blob.name[:-5]
        metadata_dict[pathway_name] = blob.download_as_string()

    return metadata_dict


@st.cache_resource()
def load_prompts() -> dict:
    """
    Load the prompts library in the Streamlit session state"
    :return: prompts as a dict
    """
    with open("./prompts/prompts.json") as f:
        return json.load(f)


# load the prompts from the resource files
# and store them in the session state
if 'prompts' not in st.session_state:
    st.session_state['prompts'] = load_prompts()

# load the metadata from the resource files
# and store them in the session state
if 'metadata' not in st.session_state:
    st.session_state['metadata'] = load_metatdata()

    with st.spinner("Loading Application components..."):
        time.sleep(5)

pg.run()
