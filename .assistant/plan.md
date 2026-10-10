# Plan

Goal: A quick quiz on world capitals: 10 questions, multiple choice, a score at the end with a Share result button that posts an image card of my score, and a best-score that survives a reload. Must look good on a phone.

1. The home page shows a 'Start quiz' button that immediately begins a new 10-question capitals quiz, with no sign-in, no URL parameter and no prior navigation needed
2. A data module under lib/ holds at least 120 countries with their capitals and region, separate from the quiz component; each quiz round draws 10 questions at random from it, and each question's four choices are the correct capital plus 3 distractor capitals drawn from other countries in the same dataset, so every choice is a real capital city
3. Answering works with four tappable answer buttons on one question at a time: choosing an answer marks it correct or incorrect, briefly shows the right capital, then advances to the next question, and the header shows 'Question 3 of 10' with the running score; tapping again while a question is already answered does nothing and cannot score twice
4. The quiz works from the keyboard: number keys 1–4 select an answer, and Enter or Space moves to the next question after answering
5. After the tenth question a results screen shows the final score as a large readout (for example '7 / 10'), a verdict line that covers the extremes too (a distinct line for 10/10 and for 0/10, not only middling scores), and a review list of all 10 questions with the user's pick and the correct answer marked
6. The results screen has a Share result button (using the shipped ShareButton) that renders a score card image with the score, the verdict and the app name, and shares or saves it; on a device without a share sheet it falls back to saving or copying, the outcome is shown as text next to the button, and the card is produced correctly for a 0/10 score as well
7. The best score is written to the provided Dexie database when a round finishes, and reloading the page still shows 'Best score: 7/10' on the home screen; beating it updates the stored best, and scoring exactly the best again keeps the best unchanged and shows a 'matched your best' message
8. The home screen also keeps a history of the last 10 finished rounds (score and date) in the database, shown as a list or table; before any round has been played it shows a 'No rounds yet' empty state instead of an empty box, and the history is still there after a reload
9. Reloading the page mid-quiz abandons the round without error: the next visit lands on the home screen, the abandoned round is not recorded in the history, and the stored best score is unchanged
10. The whole flow fits a 375px-wide phone screen with no horizontal scrolling, and every tappable control is at least 44px tall
11. The page title and description in app/identity.ts name the capitals quiz, so the browser tab shows the app's real name

These are the outcomes this task is judged against.