# Simple, Discord bot based authentication for Last Chaos
This bot was mainly created for small servers that need a way to register new users without hosting a whole website. This bot is really simple and provides bare minimum required to register new users efficiently without the need to manual database operations.

# Requirements
* Discord bot
* Server capable of running Node.js (you probably already have one if you are hosting the game)
* Node.js
* npm

# Installation
1. Download this repository
2. Open `config.json` in a text editor of your choice
3. Change bot and database configuration and optionally edit/translate other fields
4. Open cmd and navigate to the folder with these files
5. Run `npm install` - this command will install all required packages
6. Run `node commands.js` - this will add slash command to your Discord server
7. Run `node bot.js`
8. Create discord channel that will be exlusive for that bot and make sure that bot have sufficient access to that channel (view channel and send messages).
9. Type `/last-chaos-spawn` (administrator permission required) - this command will create bot message that will allow players to register.

*I highly recommend using `pm2` to run this bot as it will restart your bot in case of crash and is capable of starting your bot on machine startup.*  
*Additionally, you might need to change MySQL queries (tables names and definitions) to match your Last Chaos database structure.*

# Usage
1. Press `Register` button
2. Accept rules
3. Fill fields with your username and password
4. If registration fails, read error message and repeat this process
5. If registration is successfull, you should be able to login to the game using client

# Security note
Please use unique password while using this bot (use unique password generally while playing Last Chaos) because this game is old and uses obsolete hashing algorithm (MD5) that is currently considered extremely insecure - hashes can be cracked in the matter of seconds using dictionary attacks (or any other brute force attacks).

# License
MIT License

Copyright (c) 2023 danx91

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
