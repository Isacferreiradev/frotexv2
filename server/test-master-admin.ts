import 'dotenv/config';
import axios from 'axios';

const API_KEY = 'CHANGE_ME_IN_RAILWAY_SETTINGS';
const BASE_URL = 'http://localhost:4000/api/admin';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'X-Admin-Api-Key': API_KEY,
        'Content-Type': 'application/json'
    }
});

async function runTests() {
    console.log('🚀 Starting Master Admin API Tests...\n');

    try {
        console.log('1️⃣ Testing /metrics/overview');
        const overview = await api.get('/metrics/overview');
        console.log('✅ Success! Global Tenants:', overview.data.data.base.tenants);
        console.log('   Estimated MRR:', overview.data.data.revenue.mrr, '\n');

        console.log('2️⃣ Testing /metrics/activation');
        const activation = await api.get('/metrics/activation');
        console.log('✅ Success! Onboarded Tenants:', activation.data.data.funnel.onboarded);
        console.log('   Conversion Rate (Reg to Onboarded):', activation.data.data.conversionRates.registrationToOnboarded.toFixed(2), '%\n');

        console.log('3️⃣ Testing advanced /tenants query');
        const tenants = await api.get('/tenants?limit=3&sort=name&sortDirection=desc');
        console.log(`✅ Success! Found ${tenants.data.meta.total} tenants. Listed ${tenants.data.data.length} with pagination.`);

        if (tenants.data.data.length > 0) {
            const firstTenantId = tenants.data.data[0].id;
            console.log(`\n4️⃣ Testing /tenants/:id (360 view) for ${firstTenantId}`);

            const details = await api.get(`/tenants/${firstTenantId}`);
            console.log(`✅ Success! Loaded tenant full stats:`);
            console.log(`   Customers Usage Pct:`, details.data.data.usage.customers.pct.toFixed(2), '%');
            console.log(`   Upgrade Potential:`, details.data.data.insights.canUpgrade, '\n');

            console.log(`5️⃣ Testing /tenants/:id UPDATE (Safe manual operation)`);
            const updateResult = await api.put(`/tenants/${firstTenantId}`, {
                lockReason: 'Test via Admin Scripts'
            });
            console.log(`✅ Success! Update lockReason:`, updateResult.data.data.lockReason, '\n');
        }

        console.log('6️⃣ Testing /users');
        const users = await api.get('/users?limit=2');
        console.log(`✅ Success! Listed ${users.data.data.length} SaaS users.\n`);

        console.log('7️⃣ Testing /subscriptions');
        const subscriptions = await api.get('/subscriptions?limit=5');
        console.log(`✅ Success! Listed ${subscriptions.data.data.length} subscriptions.\n`);

        console.log('🎉 All Administrative API endpoints tested successfully!');

    } catch (err: any) {
        console.error('❌ Test failed!');
        if (err.response) {
            console.error(err.response.status, err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

runTests();
