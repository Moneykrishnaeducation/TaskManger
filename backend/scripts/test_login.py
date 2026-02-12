import urllib.request, json, urllib.error
url='http://localhost:8000/api/login/'
# send 'email' because USERNAME_FIELD is 'email' for the custom user
payload={'email':'joshi1905ou@gmail.com','password':'TestPass123!'}
data=json.dumps(payload).encode()
req=urllib.request.Request(url,data=data,headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        print(r.status)
        print(r.read().decode())
except urllib.error.HTTPError as e:
    print('HTTPError', e.code)
    print(e.read().decode())
except Exception as ex:
    print('Error', ex)
