# Canvas Quizlet Automation Relay

Canvas Quizlet Relay is a tool that automatically selects the correct answer on a Canvas multiple choice question by searching for the correct answer on Quizlet (uses DuckDuckGo).

This is not a perfect solution, but it is a good enough for most cases.

## Instructions

1. `yarn install`
2. `yarn build:main`
3. `node build/main/index.js`

Install the provided `userscript.js` file in your browser using a TamperMonkey, Greasemonkey, or similar extension.

You might need to modify the @match value in the userscript.js file to match your Canvas domain for quizzes.

I suggest to monitor your terminal for results fetching as you take the quiz. Some answers might be very dissimilar but might be correct.
