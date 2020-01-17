ls
cd dags/
ls
python email.py 
/usr/local/bin/python -m pip install -U pylint --user
pip install google-api-python-client,googleapiclient,httplib2,config,oauth2client
pip install google-api-python-client
pwd
cd dags/
ls
python test.py 
cd ..
mkdir test
mc dags/test.py test/
mv dags/test.py test/
mv dags/credentials.json test/
cd test/
ls
python test.py 
python test.py --noauth_local_webserver
mkdir files
python test.py --noauth_local_webserver
python test.py
cp credentials.json ../dags/
cd ../dags/
ls
pwd
rm token.json 
ll
ls -ltr
