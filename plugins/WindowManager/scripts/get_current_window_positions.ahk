; Get the user's filename, and delete it if it exists
OutFile = %A_ScriptDir%\window_positions.txt
if(FileExist(OutFile)) {
	FileDelete, %OutFile%
}

; Loop over all windows
WinGet, id, list,,, 
Loop, %id%
{
    this_id := id%A_Index%
    WinGetClass, this_class, ahk_id %this_id%
    WinGetTitle, this_title, ahk_id %this_id%
    WinGetPos, X, Y, W, H, %this_title%
	WinGet, state, MinMax, %this_title%,
    
    ; Record positions for all interesting windows
    if( W > 0 && this_title != "start" ) {
		FileAppend, 
    	(
    	%this_id%, %this_class%, %title%, %X%, %Y%, %W%, %H%, %state%

    	), %OutFile%
    }
}
