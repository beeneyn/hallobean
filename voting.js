// voting.js

// --- DOM Element Selection ---
const pollForm = document.getElementById('poll-form');
const resultsContainer = document.getElementById('results-container');
const pollQuestion = document.getElementById('poll-question');
const voteButton = pollForm.querySelector('button');
const pollOptions = pollForm.querySelectorAll('.poll-option');

// --- INITIAL STATE ---
voteButton.disabled = true;

// --- Firestore Database Reference ---
const pollCollection = db.collection('poll');

// --- REAL-TIME DATA LISTENER ---
pollCollection.onSnapshot(snapshot => {
    const documents = snapshot.docs;
    if (documents.length === 0) {
        console.log("No poll data found in Firestore. Please add some!");
        return;
    }
    const pollDoc = documents[0];
    const pollData = pollDoc.data();
    pollQuestion.textContent = pollData.question;
    displayResults(pollData.options);
});

// --- EVENT LISTENERS FOR OPTION SELECTION ---
pollOptions.forEach(option => {
    option.addEventListener('click', () => {
        pollOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        option.querySelector('input[type="radio"]').checked = true;
        voteButton.disabled = false;
    });
});

// --- VOTE SUBMISSION HANDLER ---
pollForm.addEventListener('submit', event => {
    event.preventDefault();

    const selectedOptionInput = document.querySelector('input[name="pollOption"]:checked');
    if (!selectedOptionInput) {
        alert("Please select an option to vote.");
        return;
    }

    voteButton.disabled = true;
    voteButton.textContent = 'Submitting...';

    const selectedOptionValue = selectedOptionInput.value;

    pollCollection.get().then(snapshot => {
        if (!snapshot.empty) {
            const pollDocId = snapshot.docs[0].id;
            const pollDocRef = db.collection('poll').doc(pollDocId);
            const voteUpdate = {};
            voteUpdate[`options.${selectedOptionValue}`] = firebase.firestore.FieldValue.increment(1);

            pollDocRef.update(voteUpdate)
                .then(() => {
                    console.log("Vote successfully recorded!");
                    showThankYouMessage();
                })
                .catch(error => {
                    console.error("Error writing document: ", error);
                    voteButton.disabled = false;
                    voteButton.textContent = 'Vote';
                });
        }
    });
});

// --- FUNCTION TO HANDLE POST-VOTE UI ---
function showThankYouMessage() {
    pollForm.style.display = 'none';
    const thankYouMessage = document.createElement('div');
    thankYouMessage.id = 'thank-you-message';
    thankYouMessage.textContent = 'Thank you for your vote!';
    resultsContainer.parentNode.insertBefore(thankYouMessage, resultsContainer);
}

// --- DISPLAY RESULTS FUNCTION ---
function displayResults(options) {
    resultsContainer.innerHTML = '<h3>Results</h3>';
    let totalVotes = 0;
    for (const option in options) {
        totalVotes += options[option];
    }

    for (const option in options) {
        const votes = options[option];
        const percentage = (totalVotes === 0) ? 0 : ((votes / totalVotes) * 100).toFixed(1);
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        // UPDATED: New HTML structure for the results
        resultItem.innerHTML = `
            <div class="progress-bar">
                <div class="progress" style="width: ${percentage}%;"></div>
                <div class="result-overlay">
                    <span class="option-name">${option}</span>
                    <span class="option-votes">${votes} votes (${percentage}%)</span>
                </div>
            </div>
        `;
        resultsContainer.appendChild(resultItem);
    }
}