const firebaseConfig = {
    apiKey: "AIzaSyAop6R33GJrzzl9WMyhQ1xQwYvJp4AHRIw",
    authDomain: "kjgold-1ded4.firebaseapp.com",
    projectId: "kjgold-1ded4",
    storageBucket: "kjgold-1ded4.firebasestorage.app",
    messagingSenderId: "547004315734",
    appId: "1:547004315734:web:fed5dc819e42f5597d23f7",
    measurementId: "G-B47GQ3ND0L"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let currentCustomerId = null;
let currentCustomerName = null;
let allTransactions = [];
auth.onAuthStateChanged((user) => {
    if (!user) window.location.href = 'index.html';
    else {
        loadUserData(user.uid);
        loadCustomers();
    }
});
function loadUserData(userId) {
    db.collection('users').doc(userId).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            document.getElementById('mobile-username').textContent = userData.username;
            document.getElementById('desktop-username').textContent = userData.username;
            document.getElementById('username-display').textContent = `Welcome, ${userData.username}`;
        }
    });
}

function loadCustomers() {
    const customerSelect = document.getElementById('customer-select');
    customerSelect.innerHTML = '<option value="">-- Select Customer --</option>';
    db.collection('customers').where("userId", "==", auth.currentUser.uid).get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const customer = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = customer.name + " (" + customer.phone + ")";
                customerSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error fetching customers:", error));
}

function setExchangeTouchRequired(isRequired) {
    const exchangeTouchInput = document.getElementById('exchange-touch');
    if (isRequired) exchangeTouchInput.setAttribute('required', 'true');
    else exchangeTouchInput.removeAttribute('required');
}

function calculateTotal() {
    const type = document.getElementById('type-select').value;
    const grams = parseFloat(document.getElementById('grams').value) || 0;
    const touch = parseFloat(document.getElementById('touch').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    let total;
    if (type === 'Fine Gold') total = grams * rate;
    else total = (grams * rate * (touch || 100)) / 100;
    document.getElementById('total').value = total.toFixed(2);
    updateCashBalance();
    calculateExchangeTotal();
}

function calculateExchangeTotal() {
    const exchangeType = document.querySelector('input[name="exchange-type"]:checked');
    const grams = parseFloat(document.getElementById('exchange-grams').value) || 0;
    const touch = parseFloat(document.getElementById('exchange-touch').value) || 0;
    const rate = parseFloat(document.getElementById('exchange-rate').value) || 0;
    let total = 0;
    if (exchangeType) {
        if (exchangeType.value === 'Fine Gold') total = grams * rate;
        else total = (grams * rate * (touch || 100)) / 100;
    }
    document.getElementById('exchange-total').value = total.toFixed(2);
    updateExchangeBalance();
}

function updateCashBalance() {
    const totalAmount = parseFloat(document.getElementById('total').value) || 0;
    const cashGiven = parseFloat(document.getElementById('cash-given').value) || 0;
    const balance = cashGiven - totalAmount;
    const balanceDisplay = document.getElementById('balance-display');
    if (balanceDisplay) {
        balanceDisplay.textContent = `Balance: ₹${balance.toFixed(2)}`;
        balanceDisplay.style.display = 'block';
        if (balance < 0) balanceDisplay.classList.add('negative-balance');
        else balanceDisplay.classList.remove('negative-balance');
    }
}

function updateExchangeBalance() {
    const totalAmount = parseFloat(document.getElementById('total').value) || 0;
    const exchangeValue = parseFloat(document.getElementById('exchange-total').value) || 0;
    const balance = exchangeValue - totalAmount;
    const balanceDisplay = document.getElementById('exchange-balance');
    if (balanceDisplay) {
        balanceDisplay.textContent = `Balance: ₹${balance.toFixed(2)}`;
        balanceDisplay.style.display = 'block';
        if (balance < 0) balanceDisplay.classList.add('negative-balance');
        else balanceDisplay.classList.remove('negative-balance');
    }
}

function toggleFormSections() {
    const selectedType = document.getElementById('type-select').value;

    // Hide all sections first
    document.getElementById('gold-details').style.display = 'none';
    document.getElementById('cash-payment-details').style.display = 'none';
    document.getElementById('exchange-gold-details').style.display = 'none';

    // Show relevant section based on selection
    if (selectedType === 'Kacha' || selectedType === 'Fine Gold') {
        document.getElementById('gold-details').style.display = 'block';
    } else if (selectedType === 'Cash Payment') {
        document.getElementById('cash-payment-details').style.display = 'block';
    } else if (selectedType === 'Exchange Gold') {
        document.getElementById('exchange-gold-details').style.display = 'block';
    }
}

// Setup input event listeners for calculation fields
function setupCalculationListeners() {
    // Gold calculation fields
    const goldInputs = ['grams', 'touch', 'rate'];
    goldInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateTotal);
        }
    });
    
    // Exchange calculation fields
    const exchangeInputs = ['exchange-grams', 'exchange-touch', 'exchange-rate'];
    exchangeInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateExchangeTotal);
        }
    });
    
    // Cash given field
    const cashGivenElement = document.getElementById('cash-given');
    if (cashGivenElement) {
        cashGivenElement.addEventListener('input', updateCashBalance);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form sections on page load
    toggleFormSections();
    
    // Set up calculation listeners
    setupCalculationListeners();
    
    // Type select change event
    document.getElementById('type-select').addEventListener('change', function() {
        const touchRequired = document.getElementById('touch-required');
        const touchInput = document.getElementById('touch');
        if (this.value === 'Fine Gold') {
            touchRequired.classList.add('optional-field');
            touchRequired.textContent = '(optional)';
            touchInput.removeAttribute('required');
            touchInput.placeholder = 'Enter touch % (optional)';
        } else if (this.value === 'Kacha') {
            touchRequired.classList.remove('optional-field');
            touchRequired.textContent = '*';
            touchInput.setAttribute('required', 'true');
            touchInput.placeholder = 'Enter touch %';
        }
        
        // Toggle form sections based on selection
        toggleFormSections();
        
        // Re-setup listeners in case elements were hidden/shown
        setupCalculationListeners();
        
        if (this.value === 'Kacha' || this.value === 'Fine Gold') {
            calculateTotal();
        }
    });

    // Exchange type radio buttons
    document.querySelectorAll('input[name="exchange-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const exchangeTouchRequired = document.getElementById('exchange-touch-required');
            const exchangeTouchInput = document.getElementById('exchange-touch');
            if (this.value === 'Fine Gold') {
                exchangeTouchRequired.classList.add('optional-field');
                exchangeTouchRequired.textContent = '(optional)';
                exchangeTouchInput.removeAttribute('required');
                exchangeTouchInput.placeholder = 'Enter touch % (optional)';
            } else {
                exchangeTouchRequired.classList.remove('optional-field');
                exchangeTouchRequired.textContent = '*';
                exchangeTouchInput.setAttribute('required', 'true');
                exchangeTouchInput.placeholder = 'Enter touch %';
            }
            calculateExchangeTotal();
        });
    });

    // Mobile menu events
    document.getElementById('mobile-menu-button').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    });
    document.getElementById('menu-close').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    });
    document.getElementById('overlay').addEventListener('click', function() {
        document.getElementById('mobile-menu').classList.remove('show');
        this.classList.remove('show');
    });

    // Add customer events
    document.getElementById('add-customer-sidebar').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('customer-modal').classList.add('show');
    });
    document.getElementById('mobile-add-customer').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('customer-modal').classList.add('show');
        document.getElementById('mobile-menu').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    });
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('customer-modal').classList.remove('show');
    });
    window.addEventListener('click', function(event) {
        if (event.target.matches('#customer-modal')) {
            document.getElementById('customer-modal').classList.remove('show');
        }
    });

    // Customer form submission
    document.getElementById('customer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('customer-name').value;
        const phone = document.getElementById('customer-phone').value;
        if (name && phone) {
            db.collection('customers').add({
                name,
                phone,
                userId: auth.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("Customer added successfully!");
                document.getElementById('customer-modal').classList.remove('show');
                this.reset();
                loadCustomers();
            }).catch(err => {
                console.error("Error adding customer: ", err);
                alert("Error adding customer.");
            });
        }
    });

    // Logout events
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => window.location.href = 'index.html');
    });
    document.getElementById('logout-btn-desktop').addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => window.location.href = 'index.html');
    });

    // Transaction type radio buttons
    document.querySelectorAll('input[name="transaction-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const paymentOptions = document.getElementById('payment-options');
            paymentOptions.style.display = (this.value === 'buy' || this.value === 'sell') ? 'block' : 'none';
            document.getElementById('cash-details').style.display = 'none';
            document.getElementById('exchange-details').style.display = 'none';
            setExchangeTouchRequired(false);
        });
    });

    // Payment method radio buttons
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const cashDetails = document.getElementById('cash-details');
            const exchangeDetails = document.getElementById('exchange-details');
            if (this.value === 'cash') {
                cashDetails.style.display = 'block';
                exchangeDetails.style.display = 'none';
                setExchangeTouchRequired(false);
            } else if (this.value === 'exchange') {
                cashDetails.style.display = 'none';
                exchangeDetails.style.display = 'block';
                setExchangeTouchRequired(true);
            }
        });
    });

    // Transaction form submission
    document.getElementById('transaction-form').addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;
        const customerId = document.getElementById('customer-select').value;
        const type = document.getElementById('type-select').value;
        
        if (!customerId || !type) {
            alert("Please select a customer and transaction type");
            return;
        }
        
        // Handle different transaction types
        if (type === 'Kacha' || type === 'Fine Gold') {
            const grams = parseFloat(document.getElementById('grams').value);
            const rate = parseFloat(document.getElementById('rate').value);
            const transactionType = document.querySelector('input[name="transaction-type"]:checked');
            
            if (isNaN(grams) || grams <= 0 || isNaN(rate) || rate <= 0 || !transactionType) {
                alert("Please fill all required fields for gold transaction");
                return;
            }
            
            // Handle gold transaction
            handleGoldTransaction(type, grams, rate, transactionType.value, customerId);
            
        } else if (type === 'Cash Payment') {
            const cashAmount = parseFloat(document.getElementById('cash-amount').value);
            const cashDirection = document.querySelector('input[name="cash-direction"]:checked');
            
            if (isNaN(cashAmount) || cashAmount <= 0 || !cashDirection) {
                alert("Please fill all required fields for cash payment");
                return;
            }
            
            // Handle cash transaction
            handleCashTransaction(cashAmount, cashDirection.value, customerId);
            
        } else if (type === 'Exchange Gold') {
            const exchangeGrams = parseFloat(document.getElementById('exchange-gold-grams').value);
            const exchangeType = document.querySelector('input[name="exchange-gold-type"]:checked');
            const exchangeGoldDirection = document.querySelector('input[name="exchange-gold-direction"]:checked');
            
            if (isNaN(exchangeGrams) || exchangeGrams <= 0 || !exchangeType || !exchangeGoldDirection) {
                alert("Please fill all required fields for exchange gold");
                return;
            }
            
            // Handle exchange transaction
            handleExchangeTransaction(exchangeGrams, exchangeType.value, customerId);
        }
    });
    
    function handleGoldTransaction(type, grams, rate, transactionType, customerId) {
        const touch = parseFloat(document.getElementById('touch').value) || 0;
        const total = parseFloat(document.getElementById('total').value) || 0;
        
        const transactionData = {
            customerId,
            type,
            grams,
            touch,
            rate,
            total,
            transactionType,
            userId: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Check payment method if it's a buy/sell transaction
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
        if (paymentMethod) {
            transactionData.paymentMethod = paymentMethod.value;
            
            if (paymentMethod.value === 'cash') {
                const cashGiven = parseFloat(document.getElementById('cash-given').value) || 0;
                transactionData.cashGiven = cashGiven;
            } else if (paymentMethod.value === 'exchange') {
                const exchangeType = document.querySelector('input[name="exchange-type"]:checked');
                if (exchangeType) {
                    transactionData.exchangeType = exchangeType.value;
                }
                const exchangeGrams = parseFloat(document.getElementById('exchange-grams').value) || 0;
                const exchangeTouch = parseFloat(document.getElementById('exchange-touch').value) || 0;
                const exchangeRate = parseFloat(document.getElementById('exchange-rate').value) || 0;
                const exchangeTotal = parseFloat(document.getElementById('exchange-total').value) || 0;
                
                transactionData.exchangeGrams = exchangeGrams;
                transactionData.exchangeTouch = exchangeTouch;
                transactionData.exchangeRate = exchangeRate;
                transactionData.exchangeTotal = exchangeTotal;
            }
        }
        
        saveTransaction(transactionData);
    }
    
    function handleCashTransaction(cashAmount, cashDirection, customerId) {
        const transactionData = {
            customerId,
            type: 'Cash Payment',
            cashAmount,
            cashDirection,
            userId: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        saveTransaction(transactionData);
    }
    
    function handleExchangeTransaction(exchangeGrams, exchangeType, customerId) {
        const exchangeTouch = parseFloat(document.getElementById('exchange-gold-touch').value) || 0;
        const exchangeGoldDirection = document.querySelector('input[name="exchange-gold-direction"]:checked');
        
        const transactionData = {
            customerId,
            type: 'Exchange Gold',
            exchangeGrams,
            exchangeType,
            exchangeTouch,
            exchangeGoldDirection: exchangeGoldDirection.value,
            userId: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        saveTransaction(transactionData);
    }
    
    function saveTransaction(transactionData) {
        console.log("Saving transaction to Firestore:", transactionData);
        
        db.collection('transactions').add(transactionData)
            .then((docRef) => {
                console.log("Transaction saved successfully with ID:", docRef.id);
                alert("Transaction saved successfully!");
                document.getElementById('transaction-form').reset();
                document.getElementById('total').value = "";
                document.getElementById('payment-options').style.display = 'none';
                document.getElementById('cash-details').style.display = 'none';
                document.getElementById('exchange-details').style.display = 'none';
                document.getElementById('cash-payment-details').style.display = 'none';
                document.getElementById('exchange-gold-details').style.display = 'none';
                document.querySelectorAll('.balance-display').forEach(el => {
                    el.style.display = 'none';
                });
            })
            .catch(err => {
                console.error("Error saving transaction:", err);
                alert("Error saving transaction: " + err.message);
            });
    }
});
