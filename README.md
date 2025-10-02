# Air-Quality-Detection

GitHub Link
https://github.com/ReconStillCodes/Air-Quality-Detection.git

Backend IP:
52.77.118.58

Frontend Link:
http://air-quality-detection.s3-website-ap-southeast-1.amazonaws.com

How to send data:

1. Make sure that you use JSON Format
   {
   "temperature": [value],
   "humidity": [value],
   "co": [value]
   }

2. HTTP request use POST
3. Connect it to http://52.77.118.58/data
4. Expect return message
   {
   "isBuzzerOn": [true / false],
   "message": [Simple message to verified connection]
   }

Example cURL usage:
curl -X POST -H "Content-Type: application/json" -d "{\"temperature\": 53, \"humidity\": 88, \"co\": 0.3}" http://52.77.118.58/data
