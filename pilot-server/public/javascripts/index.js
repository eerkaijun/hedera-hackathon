async function firstTimeVerify() {
    axios.get('/api/first-time-verification').then(async (response) => {
        console.log("Shufti response: ", response);
        console.log("Verification link: ", response.data.data.verification_url);
        const reference = response.data.data.reference;
        window.open(response.data.data.verification_url);

        let verificationStatus = "request.pending";
        let timedOut = false;
        setTimeout(() => timedOut = true, 10000 * 60);
        let checkResponse;
        while (!timedOut && verificationStatus === "request.pending") {
            checkResponse = await axios.get('/api/checkShuftiStatus', {params: {reference: reference }});
            console.log("Status response from Shufti: ", checkResponse);
            verificationStatus = checkResponse.data.data.event;
        }
        console.log("Verification done!!!!");
        if (verificationStatus === "verification.accepted") {
            passportInput.value = checkResponse.data.data.verification_data.document.document_number;
            nameInput.value = checkResponse.data.data.verification_data.document.name.full_name;
        }
    })
}

async function issuePassport() {
    const passport = {
        name: document.getElementById("name").value,
        passport: document.getElementById("passport").value,
        date: document.getElementById("date").value,
    }
    openModal("Scan this code to accept a connectionless credential:");
    hideQRCode();
    showSpinner();
    axios.post('/api/issue', passport).then(async (response) => {
        console.log("TEST: ", response);
        setQRCodeImage(response.data.invitation);
        hideSpinner();
        showQRCode();
    });
}

async function verifyPassport() {
    hideAccepted();
    openModal("Scan this code to verify the passport credential:");
    hideQRCode();
    showSpinner();
    let response = await axios.post('/api/verify');
    let verificationId = response.data.verificationId;
    setQRCodeImage(response.data.verificationRequestUrl);
    hideSpinner();
    showQRCode();

    let verification = {state: "Requested"};
    let timedOut = false;
    setTimeout(() => timedOut = true, 1000 * 60);
    while (!timedOut && verification.state === "Requested") {
        let checkResponse = await axios.get('/api/checkVerification', {params: {verificationId: verificationId }});
        verification = checkResponse.data.verification;
    }

    hideQRCode();
    closeModal();
    if (verification.state === "Accepted") {
        showAccepted();
        setAcceptedData(
            verification.proof['KYC Verification'].attributes["Name"],
            verification.proof['KYC Verification'].attributes["Passport Number"]
        );
    }
}

function openModal(text) {
    modal.style.display = "block";
    modalText.innerText = text;
}

function closeModal() {
    modal.style.display = "none";
}

function hideQRCode() {
    qr.style.display = "none";
}

function showQRCode() {
    qr.style.display = "block";
}

function setQRCodeImage(url) {
    qr.src = 'https://chart.googleapis.com/chart?cht=qr&chl=' + url + '&chs=300x300&chld=L|1';
}

function hideSpinner() {
    spinner.style.display = "none";
}

function showSpinner() {
    spinner.style.display = "block";
}

function hideAccepted() {
    accepted.style.display = "none";
}

function showAccepted() {
    accepted.style.display = "block";
}

function setAcceptedData(name, passportNumber) {
    acceptedName.value = name;
    acceptedNumber.value = passportNumber;
}

function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
