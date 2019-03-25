# ChessFriend-Fire
[![Build Status](https://travis-ci.org/SFBrand1981/ChessFriend-Fire.svg?branch=master)](https://travis-ci.org/SFBrand1981/ChessFriend-Fire)
[![Twitter Follow](https://img.shields.io/twitter/follow/SFBrand81.svg?style=social)](https://twitter.com/SFBrand81)


Use ChessFriend-Fire to create a chess database and analyze all your games.
Try it out and visit us at [www.schachfreunde-brand.de](https://www.schachfreunde-brand.de)!


<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_collage.png">
</div>


## Installation

1. Download and unzip the latest [release][release]
2. Change into the directory where you have unzipped your files
   1. On Windows, double-click on the following file:

      ```
      chessfriendfire.bat
      ```


   2. On Linux and macOS, run the following in terminal:

      ```bash
      $ npm run dev
      ```


## UCI chess engine support

  Open `Menu > Preferences` and specify the path to your chess engine. 
  By default, ChessFriend-Fire ships with Stockfish 10, one of the strongest chess engines available.
  You can find the [relevant binaries][stockfish] in the `bin` directory inside your installation folder.


## PGN import and export

   Click on the `Import` button in order to add games to your database. Start with importing the game
   [Kasparov_vs_Topalov.pgn][Kasparov_vs_Topalov], which you can find in the `tests` directory inside your installation folder.

  


[release]: https://github.com/SFBrand1981/ChessFriend-Fire/releases
[stockfish]: https://github.com/SFBrand1981/ChessFriend-Fire/tree/master/src/bin
[Kasparov_vs_Topalov]: https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/tests/Kasparov_vs_Topalov.pgn