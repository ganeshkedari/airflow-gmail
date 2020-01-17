from datetime import datetime
from airflow import DAG
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.python_operator import PythonOperator
import os
from os import environ
from datetime import timedelta
import getpass, imaplib
import sys
import string

import base64
from googleapiclient import errors

from googleapiclient.discovery import build
from httplib2 import Http
from oauth2client import file, client, tools

# tools.argparser.add_argument('-ci', '--client-id', type=str, required=True, help='The client ID of your GCP project')
tools.argparser.add_argument('-cs', '--client-secret', type=str, required=True,help='The client Secret of your GCP project')

GMAIL_CREDENTIALS_PATH = '/usr/local/airflow/dags/credentials.json'
GMAIL_TOKEN_PATH = '/usr/local/airflow/dags/token.json'
SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'


def query_for_message_ids(service, search_query):
    result = service.messages().list(userId='me', q=search_query).execute()
    results = result.get('messages')
    if results:
        msg_ids = [r['id'] for r in results]
    else:
        msg_ids = []

    return msg_ids


def get_gmail_service(credentials_path, token_path):
    store = file.Storage(token_path)
    creds = store.get()
    if not creds or creds.invalid:
        flow = client.flow_from_clientsecrets(credentials_path, SCOPES)
        creds = tools.run_flow(flow, store)
    service = build('gmail', 'v1', http=creds.authorize(Http()))
    return service.users()


def GetAttachments():
    try:
        service = get_gmail_service(GMAIL_CREDENTIALS_PATH, GMAIL_TOKEN_PATH)
        message_ids = query_for_message_ids(service, "CSV_TEST_MAIL")
        print(message_ids)
        for msg_id in message_ids:
            message = service.messages().get(userId='me', id=msg_id).execute()
            for part in message['payload']['parts']:
                print(part)
                if part['filename']:
                    if 'data' in part['body']:
                        data = part['body']['data']
                    else:
                        att_id = part['body']['attachmentId']
                        att = service.messages().attachments().get(userId='me', messageId=msg_id, id=att_id).execute()
                        data = att['data']
                    file_data = base64.urlsafe_b64decode(data.encode('UTF-8'))
                    path = "./files/"+part['filename']
                    with open(path, 'wb') as f:
                        f.write(file_data)
    except errors.HttpError as error:
        print('An error occurred: %s' % error)

dag = DAG('GetAttachments', description='GetAttachments',
          schedule_interval='5 0 0 0 0 0',
          start_date=datetime(2017, 3, 20), catchup=False)



hello_operator = PythonOperator(task_id='hello_task', python_callable=GetAttachments, dag=dag)

hello_operator

