# ChessFriend-Fire
[![Build Status](https://travis-ci.org/SFBrand1981/ChessFriend-Fire.svg?branch=master)](https://travis-ci.org/SFBrand1981/ChessFriend-Fire)
[![Twitter Follow](https://img.shields.io/twitter/follow/SFBrand81.svg?style=social)](https://twitter.com/SFBrand81)


Use ChessFriend-Fire to create a chess database and analyze all your games.
Try it out and visit us at [www.schachfreunde-brand.de](https://www.schachfreunde-brand.de)!


<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_collage.png"/>
</div>


## Installation

   1. Download and unzip the latest [release][release]. 
   2. Change into the directory where you have unzipped your files
      1. On Windows, double-click on the following file:

      ```
      chessfriendfire.bat
      ```


      2. On macOS, run the following in terminal:

      ```bash
      $ ./node_modules/nw/bin/nw ./src/
      ```

      3. On Linux, you need to have [nwjs][nwjs] installed 

      ```bash
      $ sudo apt-get install nodejs
      $ npm install
      $ npm run dev
      ```

## Features

### Ships with Stockfish 10

<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_engine.png" width="200"/>
</div>

By default, ChessFriend-Fire ships with Stockfish 10, one of the strongest chess engines available.


### One-click annotations

<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_menu.png" width="40%"/>
</div>


### Open your games in tabs

<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_tabs.png" width="40%"/>
</div>


### Fast database search

<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_search.png" width="40%"/>
</div>

### Analyse any position

<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_setup.png" width="40%"/>
</div>

### LaTeX export

<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_latex.png" width="40%"/>
</div>

  

[nwjs]: https://nodejs.org/en/
[release]: https://github.com/SFBrand1981/ChessFriend-Fire/releases
[stockfish]: https://github.com/SFBrand1981/ChessFriend-Fire/tree/master/src/bin
[Kasparov_vs_Topalov]: https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/tests/Kasparov_vs_Topalov.pgn