@echo off
title Deploy ke Firebase barokah-laundry-suci
echo ======================================================================
echo   DEPLOY KE FIREBASE: barokah-laundry-suci
echo ======================================================================
echo.
echo Pastikan Anda sudah login ke Firebase:
echo ^> firebase login
echo.
echo Mengupload folder dist ke project barokah-laundry-suci...
echo.
firebase deploy --only hosting
echo.
echo ======================================================================
echo Selesai! Web Anda aktif di https://barokah-laundry-suci.web.app
echo ======================================================================
pause
