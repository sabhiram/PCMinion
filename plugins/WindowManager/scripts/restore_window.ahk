; %1% - Window ID
; %2% - X
; %3% - Y 
; %4% - WIDTH
; %5% - HEIGHT

SetWinDelay, -1

search_id = %1%

; Loop over all windows
WinGet, id, list,,, 
Loop, %id%
{
    this_id := id%A_Index%
    if(search_id == this_id) {
    	; Get its current title
    	WinGetTitle, this_title, ahk_id %this_id%

    	; Check if it is minimized...
    	WinGet, min_max, MinMax, %this_title%

    	if(min_max == -1) {
    		WinRestore, %this_title%
    	}

    	WinMove, %this_title%, , %2%, %3%, %4%, %5%
    }
}