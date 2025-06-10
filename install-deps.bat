@echo off
echo Installing dependencies for cloud functions...

cd cloudfunctions

echo Installing dependencies for admin...
cd admin
npm install
cd ..

echo Installing dependencies for adminLogin...
cd adminLogin
npm install
cd ..

echo Installing dependencies for addAdmin...
cd addAdmin
npm install
cd ..

echo Installing dependencies for checkAdmin...
cd checkAdmin
npm install
cd ..

echo Installing dependencies for createIndexes...
cd createIndexes
npm install
cd ..

echo Installing dependencies for initAdmin...
cd initAdmin
npm install
cd ..

echo Installing dependencies for initAdminUser...
cd initAdminUser
npm install
cd ..

echo Installing dependencies for initProducts...
cd initProducts
npm install
cd ..

echo Installing dependencies for initTestData...
cd initTestData
npm install
cd ..

echo Installing dependencies for login...
cd login
npm install
cd ..

echo Installing dependencies for checkCollections...
cd checkCollections
npm install
cd ..

echo All dependencies installed!
pause 