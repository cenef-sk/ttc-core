# ttc-core
This is ttc-core development guide. ttc-core provides REST API that can be used by ttc-web application and by mobile game (ttc-app).

## Installation

1. Install node for your platform (tested on v12.19.0)
https://nodejs.org/en/download/

2. Install MongoDB for your platform (tested on v4.4.12)
https://www.mongodb.com/download-center?ct=atlasheader2#community and follow installation instruction https://docs.mongodb.com/manual/administration/install-community/

3. Clone or fork source code from our git repository
https://github.com/cenef-sk/ttc-core

4. Navigate into the root folder of the ttc-core project

5. Run `npm install`

6. Modify `/config.js` based on your local settings

7. Load initial data to database (see init.js), if needed `npm run init`

8. Start server `npm run start`
