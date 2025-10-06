# Air-Quality-Detection

GitHub Link
https://github.com/ReconStillCodes/Air-Quality-Detection.git

Backend IP:
http://52.77.118.58/api/data

Frontend Link:
http://52.77.118.58

How to send data:

1. Make sure that you use JSON Format
   {
   "temperature": [value],
   "humidity": [value],
   "co": [value]
   }

2. HTTP request use POST
3. Connect it to http://52.77.118.58/api/data
4. Expect return message
   {
   "isBuzzerOn": [true / false],
   "message": [Simple message to verified connection]
   }

Example cURL usage:
curl -X POST -H "Content-Type: application/json" -d "{\"temperature\": 53, \"humidity\": 88, \"co\": 0.3}" http://52.77.118.58/api/data

# ==========================

All API Calls

1. Post Sensor Data
   Method = POST
   http://52.77.118.58/api/data
   {
   "temperature": 20,
   "humidity": 80,
   "co": 0.01
   }

2. Get Table With Pagination
   Method = GET
   http://52.77.118.58/data/table?page=2&size=20

3. Get Chart (show 20 data)
   Method = GET
   http://52.77.118.58/api/data/chart
