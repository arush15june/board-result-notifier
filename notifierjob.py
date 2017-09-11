'''
This Script checks if the result is out, sends an instant notification if its out, 
else it will just send notifications at fixed times (UTC),
If it has sent the instant notification it wont send it again 
by checking with a locally stored file.

I ran this script on a xshellz.com shell.

Setup a cronjob for this script 

'''

import file,sys
from time import sleep
import requests
import json

serverURL = ""
statusEndpoint = "resultStatus"
notificationEndpoint = "notifyAll"

status = requests.get(serverURL+"/"+resultStatus)
status = json.loads(status.text);
status = status['status'];

notify = requests.get(serverURL+"/"+notificationEndpoint)
print notify.text;

if(status):
	r = open("true.txt","w").read();
	if(r == '1') sys.exit();
	open("true.txt","w").write("1")
	notify = requests.get(serverURL+"/"+notificationEndpoint)

if(time.gmtime(time.time()).tm_hr == 6 and time.gmtime(time.time()).tm_min >= 0 and time.gmtime(time.time()).tm_hr <= 10)
	notify = requests.get(serverURL+"/"+notificationEndpoint)
if(time.gmtime(time.time()).tm_hr == 13 and time.gmtime(time.time()).tm_min >= 0 and time.gmtime(time.time()).tm_hr <= 10)
	notify = requests.get(serverURL+"/"+notificationEndpoint)	
