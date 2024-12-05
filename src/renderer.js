// #### Event Listeners #####
const SeedPhrase = document.querySelector("#seed_phrase");
const ReceiverAddress = document.querySelector("#receiver_address");
const Amount = document.querySelector("#amount");

document.querySelector("#transfer").addEventListener("click", async (e) => {
    const seedPhrase = SeedPhrase.value;
    const receiverAddress = ReceiverAddress.value;
    const amount = parseInt(Amount.value);

    let result = await window.action.transfer({ seedPhrase, receiverAddress, amount });
    if (!result.status) {
        alert(result.msg);
        return;
    }

    alert('Success');
})

document.querySelector("#cancel").addEventListener("click", async (e) => {
    SeedPhrase.value = "";
    ReceiverAddress.value = "";
    Amount.value = 0;
})

// ##### Act Variables and Functions #####