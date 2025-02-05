const API_SIGNIN = 'https://adam-jerusalem.nd.edu/api/auth/signin';
const API_GRAPHQL = 'https://adam-jerusalem.nd.edu/api/graphql-engine/v1/graphql';

async function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    const auth = btoa(`${user}:${pass}`);

    try {
        const res = await axios.post(API_SIGNIN, null, {
            headers: { 'Authorization': `Basic ${auth}` }
        });

        const jwt = res.data;

        if (!jwt || jwt.split('.').length !== 3) {
            throw new Error('Invalid JWT');
        }

        localStorage.setItem('jwt', jwt);
        localStorage.setItem('user', user);

        loadProfile();
    } catch (err) {
        console.error('Login failed:', err);
        document.getElementById('error-msg').textContent = 'Login failed';
    }
}

async function loadProfile() {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('profile-box').classList.remove('hidden');

    try {
        const token = localStorage.getItem('jwt');
        if (!token) throw new Error('No JWT token found in localStorage');

        const query = `{
            user {
                id
                firstName
                lastName
                auditRatio
                xps {
                    amount
                    path
                }
                groups{
                    id
                }
            }
            transaction {
                type
                amount
                createdAt
            }
        }`;

        const response = await axios.post(API_GRAPHQL, { query }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('GraphQL response:', response.data);

        const user = response.data?.data?.user?.[0];
        const transactions = response.data?.data?.transaction || [];

        if (!user) throw new Error('User data not available');

        document.getElementById('welcome-msg').textContent = `Welcome, ${user.firstName || localStorage.getItem('username')} :)`;

        let piscineGoXP = user.xps
            .filter(xp => xp.path.startsWith('/adam/piscine-go/'))
            .reduce((sum, xp) => sum + (xp.amount || 0), 0) / 1000;

        let piscineJavaXP = user.xps
            .filter(xp => xp.path.startsWith('/adam/module/piscine-js/'))
            .reduce((sum, xp) => sum + (xp.amount || 0), 0) / 1000;
        


        let highestSkillProg = transactions
            .filter(tx => tx.type === 'skill_prog')
            .reduce((max, tx) => Math.max(max, tx.amount), 0);
            

            document.getElementById('user-info').innerHTML = `
            <p><strong>ID</strong></p>
            <p>${user.id}</p>
            <hr style="border: 1px solid rgba(255, 105, 180, 1); width: 150%; border-radius: 2px; transform: translateX(-15%);">
        
            <p><strong>Name</strong></p>
            <p>${user.firstName} ${user.lastName}</p>
            <hr style="border: 1px solid rgba(255, 105, 180, 1); width: 150%; border-radius: 2px; transform: translateX(-15%);">
        
            <p><strong>Audit Ratio</strong></p>
            <p>${user.auditRatio.toFixed(3)}</p>
            <hr style="border: 1px solid rgba(255, 105, 180, 1); width: 150%; border-radius: 2px; transform: translateX(-15%);">
        
            <p><strong>Total XP from Piscine-Go</strong></p>
            <p>${piscineGoXP.toFixed(2)} KB</p>
            <hr style="border: 1px solid rgba(255, 105, 180, 1); width: 150%; border-radius: 2px; transform: translateX(-15%);">
        
            <p><strong>Total XP from Piscine-JS</strong></p>
            <p>${piscineJavaXP.toFixed(2)} KB</p>
            <hr style="border: 1px solid rgba(255, 105, 180, 1); width: 150%; border-radius: 2px; transform: translateX(-15%);">
        
            <p><strong>Total XP from module</strong></p>
            <p>${calculateTotalXP(user.xps)} KB</p>
            <hr style="border: 1px solid rgba(255, 105, 180, 1); width: 150%; border-radius: 2px; transform: translateX(-15%);">
        
            <p><strong>Highest Checkpoint Level</strong></p>
            <p>${highestSkillProg}%</p>
            <hr style="border: 1px solid rgba(255, 105, 180, 1); width: 150%; border-radius: 2px; transform: translateX(-15%);">
        
            <p><strong>Groups</strong></p>
            <p>${user.groups.length}</p>
        `;
        

        console.log('User XP data:', user.xps);
        console.log('Transaction data:', transactions);

        createBarChart(user.xps);
        createPieChart(transactions)
        createLineChart(transactions);


    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('user-info').innerHTML = '<p style="color: red;">Error loading data</p>';
    }
}


function calculateTotalXP(xps) {
    const modulePathRegex = /module(?!\/piscine)/i;
    const totalModuleXp = xps
        .filter(xp => modulePathRegex.test(xp.path)) 
        .reduce((sum, xp) => sum + xp.amount, 0);

    return ((totalModuleXp + 70000) / 1000).toFixed(0); // تحويل XP إلى KB
}


function createBarChart(xps) {
    const xpData = xps.reduce((acc, xp) => {
        if (xp.path.startsWith('/adam/module/piscine-js/')) {
            acc['Piscine-Java'] = (acc['Piscine-Java'] || 0) + xp.amount;
        } else if (xp.path.startsWith('/adam/piscine-go/')) {
            acc['Piscine-Go'] = (acc['Piscine-Go'] || 0) + xp.amount;
        } else {
            acc['Module'] = (acc['Module'] || 0) + xp.amount;
        }
        return acc;
    }, {});

    console.log('XP data for bar chart:', xpData);

    const ctx = document.getElementById('xpBarChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(xpData),
            datasets: [{
                label: 'Total XP by Project',
                data: Object.values(xpData),
         backgroundColor: [
                    'rgba(255, 105, 180, 0.5)', // Piscine-Java in pink (Light Pink)
                    'rgba(255, 20, 147, 0.5)',  // Piscine-Go in pink (Deep Pink)
                    'rgba(255, 182, 193, 0.5)'  // Module in pink (Light Pink)
                ],
                borderColor: [
                    'rgba(255, 105, 180, 1)',   // Piscine-Java border in pink
                    'rgba(255, 20, 147, 1)',    // Piscine-Go border in deep pink
                    'rgba(255, 182, 193, 1)'    // Module border in light pink
                ],
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}


function createPieChart(transactions) {
    const skills = ['go', 'html', 'js', 'sql', 'unix', 'css', 'docker'];

    const skillData = transactions
        .filter(tx => tx.type.startsWith('skill_'))
        .reduce((acc, tx) => {
            const skillType = tx.type.replace('skill_', ''); 
            if (skills.includes(skillType)) {
                acc[skillType] = Math.max(acc[skillType] || 0, tx.amount); 
            }
            return acc;
        }, {});

    console.log('Skill data for pie chart:', skillData); 

    if (Object.keys(skillData).length === 0) {
        document.getElementById('skillPieChart').innerHTML = "<p>No skill data available</p>";
        return;
    }

    const labels = Object.keys(skillData);
    const data = Object.values(skillData);
    const ctx = document.getElementById('skillPieChart').getContext('2d');

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 105, 180, 0.6)', // Light pink
                    'rgba(255, 20, 147, 0.6)',  // Deep pink
                    'rgba(255, 182, 193, 0.6)', // Light pink
                    'rgba(255, 160, 122, 0.6)', // Light coral
                    'rgba(255, 215, 0, 0.6)',   // Gold
                ],
                borderColor: [
                    'rgba(255, 105, 180, 1)',   // Light pink border
                    'rgba(255, 20, 147, 1)',    // Deep pink border
                    'rgba(255, 182, 193, 1)',   // Light pink border
                    'rgba(255, 160, 122, 1)',   // Light coral border
                    'rgba(255, 215, 0, 1)',     // Gold border
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const label = tooltipItem.label;
                            const value = tooltipItem.raw;
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
}


function createLineChart(transactions) {
    // ترتيب المعاملات حسب التاريخ للتأكد من أنها مرتبة من الأقدم للأحدث
    transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const dateXPMap = {};

    transactions.forEach(tx => {
        const date = new Date(tx.createdAt);
        const formattedDate = date.toLocaleDateString('en-GB'); // يوم/شهر/سنة
        const amount = tx.amount;

        // إذا كان التاريخ موجودًا بالفعل في الخريطة، نجمع الـ XP
        if (dateXPMap[formattedDate]) {
            dateXPMap[formattedDate] += amount;
        } else {
            // إذا كان التاريخ غير موجود، ننشئ له قيمة جديدة
            dateXPMap[formattedDate] = amount;
        }
    });

    const dates = Object.keys(dateXPMap);  // الحصول على جميع التواريخ
    const xps = Object.values(dateXPMap);  

    const step = 10; 
    const reducedDates = dates.filter((date, index) => index % step === 0);
    const reducedXps = xps.filter((_, index) => index % step === 0);

    console.log('Grouped transaction dates for line chart:', reducedDates);
    console.log('Summed transaction xps for line chart:', reducedXps);


    const ctx = document.getElementById('newChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',  
        data: {
            labels: reducedDates,  
            datasets: [{
                label: 'XP over Time',  
                data: reducedXps, 
                borderColor: 'rgba(255, 105, 180, 1)',  
                fill: false,  
                tension: 0.1  
            }]
        },
        options: {
            responsive: true,  
            plugins: {
                legend: {
                    position: 'top',  
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const label = tooltipItem.label;
                            const value = tooltipItem.raw;
                            return `${label}: ${value}`;  
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',  
                },
                y: {
                    beginAtZero: true,  
                }
            }
        }
    });
}



function logout() {
    localStorage.clear();
    location.reload();
}

if (localStorage.getItem('jwt')) loadProfile();
