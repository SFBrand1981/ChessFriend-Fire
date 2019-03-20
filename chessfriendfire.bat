if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "" /min "%~dpnx0" %* && exit
start "" /B .\node_modules\nw\nwjs\nw.exe src
exit
