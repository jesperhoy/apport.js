REM to run in powershell type: ./build.bat
c:\tools\esbuild.exe "--banner:js=/*!Apport.js v. 1.0.0 - https://github.com/jesperhoy/apport.js - Copyright 2024 Jesper Hoy*/" src/apport.ts --bundle --minify --sourcemap --outfile=/output/apport.js
