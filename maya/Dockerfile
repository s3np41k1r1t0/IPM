FROM python:3.8-slim-buster
WORKDIR /app
COPY . .
RUN apt update && apt install gcc -y
RUN pip3 install -r requirements.txt
EXPOSE 5000
CMD ["python3","autocomplete.py"]
