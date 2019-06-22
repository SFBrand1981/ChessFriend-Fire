# ChessFriend-Fire
[![Build Status](https://travis-ci.org/SFBrand1981/ChessFriend-Fire.svg?branch=master)](https://travis-ci.org/SFBrand1981/ChessFriend-Fire)
[![Twitter Follow](https://img.shields.io/twitter/follow/SFBrand81.svg?style=social)](https://twitter.com/SFBrand81)


Use ChessFriend-Fire to create a chess database and analyze all your games.
ChessFriend-Fire is open source and runs on any platform.



<div style="text-align: center;">
     <img src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_collage.png?v=20190621"/>
</div>


## Installation

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

      3. On Linux, if the above command does not work, you need to compile a recent version of [node.js][nodejs] for yourself. The following commands can be used to install
      ChessFriend-Fire and the latest version of node using [nvm][nvm] (tested with Ubuntu 18.04.2 LTS):

      ```bash
      $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
      $ nvm install --latest-npm
      $ npm install nw
      $ ./node_modules/nw/bin/nw ./src/
      ```

   3. When you run ChessFriend-Fire for the first time, click on the **Import** button and select the file `KingBaseLite2019-04.pgn` from the
   installation directory. This will import about 7000 games from [kingbase-chess.net][kingbase] into your database (duration: approx. 10min).

---


## Features


### Ships with Stockfish 10


<img align="left" src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_engine.png?v=20190621" width="40%"/>

By default, ChessFriend-Fire includes the binaries of Stockfish 10, one of the strongest chess engines available. Start the engine by clicking
on the 'play' button underneath the chess board. With a right-click on the displayed engine lines, you can open the engine settings menu,
where you can specify the path to the engine (can be any UCI-compatible chess engine installed on your system) and basic settings
like multiPV (number of variations which the engine calculates simultaneously) and the number of CPU threads that the engine
is allowed to use (default: 1).



<br clear="both"/>

---

### One-click annotations

<img align="left" src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_menu.png?v=20190621" width="40%"/>

A right-click into the notation panel opens a context menu with shortcuts to commonly used numeric annotation glyphs (NAGs) which upon
selection will be automatically inserted after the currently highlighted move.


<br clear="both"/>

---


### Open your games in tabs


<img align="left" src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_tabs.png?v=20190621" width="40%"/>


ChessFriend-Fire opens all your games in tabs. It has never been easier to switch between all your favorite games!


<br clear="both"/>

---

### Fast database search


<img align="left" src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_search.png?v=20190621" width="40%"/>


With ChessFriend-Fires's powerful search functionality, you can browse through any database with lightning speed.
ChessFriend-Fire also allows you to tag your games with custom labels, which makes it super easy to find them later again.


<br clear="both"/>

---

### Analyse any position


<img align="left" src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_setup.png?v=20190621" width="40%"/>


A click on 'Setup position' enables you to setup an arbitrary position on a chessboard and search for it in the database
or add it as the starting point of a new game. Move the pieces around with a click from your mouse.


<br clear="both"/>

---


### LaTeX export


<img align="left" src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/docs/ChessFriend-Fire_latex.png?v=20190621" width="40%"/>


ChessFriend-Fire allows you to export your game as a LaTeX-file and helps you to produce publication-ready documents
in the twinkling of an eye. For example, any comment of the form `\diagram` will automatically be converted into
a chess diagram, without any further user action necessary. In order to convert the LaTeX file into a pdf-document,
you need to have a LaTeX processor like [xelatex][xelatex] installed.

<br clear="both"/>

---

### Keyboard shortcuts


<div style="text-align: center;">


| Command                          | Function           |
|----------------------------------|--------------------|
| <kbd>&leftarrow;</kbd>            | Previous move      |
| <kbd>&rightarrow;</kbd>           | Next move          |
| <kbd>Space</kbd>	           | Insert engine move |
| <kbd>\diagram</kbd>(as text in comments)   | Insert diagram in LaTeX-export |

</div>

<br clear="both"/>


---

### Icon

<img align="left" src="https://github.com/SFBrand1981/ChessFriend-Fire/blob/master/src/icon/icon.png?v=20190621" width="40%"/>


ChessFriend-Fire's icon shows a modified version of the coat of arms of Aachen-Brand, the district in which the chess club 
[Schachfreunde Brand 1981 e.V.][SFBrand], birthplace of the idea for this project, is located. The name ChessFriend-Fire
is a silly pun that exploits the multiple meanings of the word *Brand*, which has the meaning of *blaze* or *fire* in German.
Nevertheless, if you want to help to improve the code, you are kindly invited to do so wherever you live.


[7zip]: https://www.7-zip.org/download.html
[kingbase]: http://www.kingbase-chess.net/
[nvm]: https://github.com/nvm-sh/nvm
[nodejs]: https://nodejs.org/en/
[release]: https://github.com/SFBrand1981/ChessFriend-Fire/releases
[stockfish]: https://github.com/SFBrand1981/ChessFriend-Fire/tree/master/src/bin
[xelatex]: https://en.wikipedia.org/wiki/XeTeX
[SFBrand]: https://www.schachfreunde-brand.de