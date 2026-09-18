# MVP


## Tools

* Node (for managing operations)
* Simple single entry info doc (for current file info)
* openssl (for hashes)


## User operations

* Allow users to upload audio clips
    * Max 200KB (~2.0 seconds), valid file type, at valid position in seconds (float)
        * Fail if > 200KB
        * Fail if not recognized file type
        * Success if file can be included
    * Provide 200 success if correct or other error if fail
        * Increase submission count++
* For a particular track allow users to request current version of main audio file
* For a particular track allow users to request the total submission count


## App operations

* Manage successful submissions
    * Save new submissions with hash
    * Wait for x number of uploads before processing
    * Splice main audio piece to include new submission
    * Concatenate spliced audio and sub together and write over original audio
    * Remove submissions after completed splice and save


## Misc Operations

* Serve UI files


## UI

* Explanation of Project
* Load/Reload audio in it's current state
* Show number of included subs
* Upload form/ Record Ability
    * Error feedback
    * Success message
    

## Process

### Processing uploaded audio

0. Check file size is under 200kb
    - If true, create a hash `openssl rand -hex 3` value to represent this file
1. Check that file format is equal to wav
    - `soxi -t <infile> // must return wav`
3. Change sample rate to 44.1k, bit rate to 16, normalise to 0, mix to mono, save with hash
    - `sox <infile> -b 16 <outfile> channels 1 rate 44.1k norm 0`
4. Increment number of files to be processed


### Mixing upload with original

1. Dequeue reference and process:
    - Position for mix (starting point where mix appears)
    - Length of mix (dependent on position as distance from end of original v length of upload)
        - Get length of original (10.0 secs)
        - Get length of upload (max 2.0 secs)
        - Set trimLen variable
            - If position == 0 then 0, as we only need mix + post
            - If position + length of upload < length of original, then 1 as we have all 3 pre, mix, post parts
            - If position + length of upload == length of original, then 2 as we only need pre and mix
            - If position + length of upload > length of original, then 3 as we need to cycle the loop around
2. Trim from start position the appropriate length of audio from original
    - If trimLen == 0
        - `sox <original> <temp_mix> trim 0 <upload_len> // output trim from start of original to len of upload`
        - `sox <original> <temp_post> trim <upload_len> // output trim from len of upload to end of original`
    - Else If trimLen == 1
        - `sox <original> <temp_pre> trim 0 <position> // output trim from start of original to position`
        - `sox <original> <temp_mix> trim <position> <upload_len> // output trim from position to len of upload`
        - `sox <original> <temp_post> trim <upload_len> // output trim from len of upload to end of original`
    - Else If trimLen == 2
        - `sox <original> <temp_pre> trim 0 <position> // output trim from start of original to position`
        - `sox <original> <temp_mix> trim <position> // output trim from position to end of original`
    - Else
        - Trim original, position to end (get length 1) <3b>
        - Trim new, 0 to length 1, length 1 to end (get length 2) <3a, 1a>
        - Trim original, 0 to length 2, length 2 to position <1b, 2>
4. Mix upload and trimmed piece together
    - If trimLen != 3
        - `sox <upload> <temp_mix> <new_mix> --combine mix // Output mix of upload and original`
    - Else
        - `sox <3a> <3b> <new3> --combine mix // Output mix of upload and original`
        - `sox <1a> <1b> <new1> --combine mix // Output mix of upload and original`
5. Concatenate original and mix together is correct order to create the final with unique hash name
    - If trimLen == 0
        - `sox <new_mix> <temp_post> <hash> --combine concatenate // output final file`
    - Else If trimLen == 1
        - `sox <temp_pre> <new_mix> <temp_post> <hash> --combine concatenate // output final file`
    - Else If trimLen == 2
        - `sox <temp_pre> <new_mix> <hash> --combine concatenate // output final file`
    - Else
        - `sox <new1> <2> <new3> <hash> --combine concatenate`
6. Update records by increasing submission count + 1 and current version hash name
7. Remove upload