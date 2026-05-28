# HeyTony Image Tool: Compression Tweaks & Download Limits

This plan covers tweaking the auto-compression threshold to 4.75MB and addressing the browser-enforced 10-file download limit.

## User Review Required

> [!WARNING]  
> The reason the browser only downloads the first 10 images is due to built-in security restrictions. Browsers like Chrome will automatically block websites that try to trigger more than 10 consecutive file downloads instantly to prevent malicious "download bombing." 
> 
> Here are your options for bypassing this restriction:
> 
> **Option A: Batch Zipping (Highly Recommended)**
> We integrate a lightweight library (`JSZip`) into the application. If you convert multiple files, the tool bundles all of the finalized images into a single `Converted_Images.zip` file and downloads it.
> *Pros:* 100% bypasses browser limits, downloads instantly, and keeps your downloads folder clean.
> *Cons:* You have to unzip the folder after it downloads.
> 
> **Option B: Paced Downloads (Staggered)**
> We add an artificial 1.5-second delay between every single file download. 
> *Pros:* You still get individual files.
> *Cons:* It takes much longer to finish, and the browser will still show a pop-up asking "Allow this site to download multiple files?" which stops the queue until you click Yes.
> 
> **Option C: File System Access API**
> When you click Convert, the app prompts you to select a folder on your computer. It then invisibly writes all the converted images directly into that folder.
> *Pros:* Magical experience, saves individual files natively without zip.
> *Cons:* Only works on modern Chrome/Edge browsers (Safari and Firefox will fail).
> 
> **Question:** Which of these three options (A, B, or C) would you like to proceed with?

## Proposed Changes

### [MODIFY] `src/App.jsx`
- Update the Checkbox UI text from `Auto-Compress to <4.9MB` to `Auto-Compress to <4.75MB`.
- Implement the chosen Download bypass architecture (JSZip, Delays, or File API) within the `startConversion` loop.

### [MODIFY] `src/ImageProcessor.js`
- Change `TARGET_SIZE` from `4.9 * 1024 * 1024` to `4.75 * 1024 * 1024`.
