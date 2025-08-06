FROM python:3.10

# install pip
RUN pip install -U pip

# EXPOSE PORT 8080
EXPOSE 8080

# set up files
WORKDIR /app2
COPY . ./

# install libraries
RUN pip3 install -r requirements.txt

# Run
ENTRYPOINT ["streamlit", "run", "streamlit_app.py", "--server.port=8080", "--browser.serverAddress=0.0.0.0"]
