  You're inside our new note taking app PKM called NoTaker. It's outstanding main feature is a whatsapp chat like stream where a user can simply
  paste content, text, markdown, code, images and it appears time tagged in the stream and is saved to a sqlite DB on the backend, images should
  be stored as files into folders of current date labeled with current time (or if they had a filename to begin with, time_filename), theres a 3
  column layout, left sidebar has a calendar and below an eisenhower matrix, center is the chat stream, right is a stream of browser history and
  bookmarks on like a string that is time every ten minutes. The basic functions are there now but lots of detail work is unfinished or not
  working properly:

  - Images aren't saved as files but as data:124biuawr... which is not wanted. We need a backend updated, on pasting or dragging in images, the
  process must be: submit file to backend, backend stores it to the organized folder filename, backend returns a link for frontend, frontend
  inserts image via this link. That way also advanced features like cropping after the fact and optionally undoing should easily be possible,
  since we can always recall the original file
  - The timeline of bookmarks and browser history sometimes throws backend errors about too large messages, not sure what / why, currently only
  chrome is implemented and we want to keep it that way till everything else is finished (in the end we'll add other browsers, too). However,
  the general, cronjob import WORKS, so dont break it.
  - Mostly the chat input using Milkdown and the chat stream are a mess, inserting code doesnt work right, inserting markdown is halfway broken,
  the editor input itself behaves weirdly and not like you'd expect from an advanced wysiwyg. THere's no time displayed on the entry in the
  stream.
  - Entries in the stream in general aren't placed as intended, next to the correct time in the bookmark column, but just at the bottom
  - All buttons on entries in the stream are either vanished, or just unlabeled empty boxes, editing mode when clicking is completely screwed
  lacks all formatting, doesnt work as expected, it's just unfinished completely
  - It should be possible to click on a bookmarkstream time and insert an entry there, also on the past. The chat editor input should have a
  time selection option in the toolbar, clicking the sidebar time in the bookmark stream could simply change the time for that next entry. There
  should be a checkbox next to it, saying "dont reset time after entry" so we can activate a checkbox and keep adding entries under that time,
  or if unchecked reset time after one timeplaced entry
  - To properly make that time connection, it will likely be needed to redo the way both streams are done in html css, currently theyre
  independent css grid columns, but it should instead have like a horizontal connection, like chatentry + bookmarkentry in one wrap. The
  "time-on-string-of-dots" between entries should adapt to the height of the chat entries, the time connection is always correct
  - The sidebar eisenhower matrix is still very basic, lacks editing and further featuers
  - Each chat entry misses a burger icon with all editing options, instead therea re now half broken unlabelled buttons
  - We later wanted to integrate some smallscale AI that can automatically add tags, find keywords and that way enrich chat entries in our DB
  and allow for advanced features like a D3 information node graph and a deep search function, maybe even AI rag. There should be a alltime CPU
  supertiny model for this work and also a connection for a local Ollama GPT-OSS for RAG like content creation. However, ALL AI FEATURES HAVE
  LOWEST PRIORITY, its still belongs onto the todo list
  - In the left icon sidebar we have multiple pages, while they're all lowest Prio and not all are what we actually wanted there, e.g. theres a
  separate bookmark page, thats fine, but all bookmarks arent formatted correctly in properly list and styling, instead they're in large boxes
  with all blue font way too large, all metadata missing. As I said, lots of detail work

  Keep working on details now, dont break anything, keep working with individual code files instead of monolits, also for CSS, we always got
  both back and frontend running with auto hot reload and monitor progress, can give feedback or interrupt when something breaks. You dont run
  npm except for installing libs.

  You updated GEMINI.md always with our instructions, TODOs, dones. After making an update, you dont immediately consider it "Done", but instead
  you contemplate, how a real coding and testing team would approach it further, like which further details will be needed to work on, what
  might be user feedback, how to increase app behaviour comfort, visual details, etc. and note that into a recommend further steps below a
  crossed-off todo. When you read the todos, you take these recommendations very seriously and try to achieve them. Add my initial instructions
  also (this text) and keep it in there.

  In general, the app is now in state 0.5.0.alpha, its a demo but not fully usable. Bring it to 1.0 release, step by step, always keep
  exchanging thoughts with me about what where when why how.