# ChessFriend-Fire
[![Build Status](https://travis-ci.org/SFBrand1981/ChessFriend-Fire.svg?branch=master)](https://travis-ci.org/SFBrand1981/ChessFriend-Fire)
[![Twitter Follow](https://img.shields.io/twitter/follow/SFBrand81.svg?style=social)](https://twitter.com/SFBrand81)


Use ChessFriend-Fire to create a chess database and analyze all your games.
ChessFriend-Fire is open source and runs on any platform.



<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_collage.png?v=20190621"/>
</div>


# Installation

   1. Download the files from the latest ChessFriend-Fire [release][release].
   On a Windows machine, you can use the tool [7zip][7zip] to unzip the `release_win.tar.gz` archive.
      
   2. Change into the directory where you have unzipped your files.
   
      1. On a Windows machine, double-click on the file:

      ```
      chessfriendfire.bat
      ```


      2. On macOS and Linux, run the following in terminal:

      ```bash
      $ ./node_modules/nw/bin/nw ./src/
      ```

      3. On Linux, if the command above does not work, you might need to compile the required packages yourself.
      Download the recent version of [nwjs][nwjs] and copy *all* the content of the ChessFriend-Fire release folder
      into the nwjs directory. You can then build the app with the following commands (tested with Ubuntu 18.04.2 LTS):

      ```bash
      $ rm -rf ./node_modules # removes existing modules
      $ rm package-lock.json
      $ npm install # builds modules again
      $ npm start
      ```



   3. When you run ChessFriend-Fire for the first time, you might want to click on the **Database** button and choose to import the ChessFriend-Fire database, which you can download and unzip from the [ChessFriend-Fire Database][DB] release. The database contains over 1 Million recent grandmaster games in a special pgn-format which can be imported much faster than a normal pgn file.




# Features

- Load and save PGN files
- Browse chess games, including variations
- Label games with custom tags
- Enter moves, variations, and comments
- Pin multiple games as tabs  
- Setup board, copy/paste FEN
- Search in database for positions, players or tags
- Autosave and redo/undo history
- Analyze using UCI chess engines
- Integrated Stockfish engine




<br clear="both"/>



## Keyboard shortcuts


<div style="text-align: center;">


| Command                                              | Function                                       |
|------------------------------------------------------|------------------------------------------------|
| <kbd>&leftarrow;</kbd>                               | Previous move                                  |
| <kbd>&rightarrow;</kbd>                              | Next move                                      |
| <kbd>&uparrow;</kbd>, <kbd>&downarrow;</kbd>         | Select move in the "Select variation" window. Confirm your choice with <kbd>&leftarrow;</kbd>|



</div>

<br clear="both"/>



## Icon

<img align="left" src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/src/icon/icon.png?v=20190621" width="40%"/>


ChessFriend-Fire's icon shows a modified version of the coat of arms of Aachen-Brand, the district in which the chess club 
[Schachfreunde Brand 1981 e.V.][SFBrand], birthplace of the idea for this project, is located. The name ChessFriend-Fire
is a silly pun that exploits the multiple meanings of the word *Brand*, which has the meaning of *blaze* or *fire* in German.
Nevertheless, if you want to help to improve the code, you are kindly invited to do so wherever you live.


[7zip]: https://www.7-zip.org/download.html
[kingbase]: http://www.kingbase-chess.net/
[nvm]: https://github.com/nvm-sh/nvm
[nwjs]: https://nwjs.io/downloads/
[nodejs]: https://nodejs.org/en/
[release]: https://github.com/SFBrand1981/ChessFriend-Fire/releases
[stockfish]: https://github.com/SFBrand1981/ChessFriend-Fire/tree/master/src/bin
[xelatex]: https://en.wikipedia.org/wiki/XeTeX
[SFBrand]: https://www.schachfreunde-brand.de
[DB]: https://github.com/SFBrand1981/ChessFriend-Fire/releases/tag/2019.07.23-DB
