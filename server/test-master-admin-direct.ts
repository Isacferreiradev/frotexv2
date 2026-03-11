import 'dotenv/config';
import { AdminMetricsService } from './src/services/admin-metrics.service';
import { AdminDataService } from './src/services/admin.service';

async function runDirectTests() {
    console.log('🚀 Testing Master Admin Services Directly...\n');

    try {
        console.log('1️⃣ Getting Global Overview');
        const overview = await AdminMetricsService.getGlobalOverview();
        console.log('✅ Global Tenants:', overview.base.tenants);
        console.log('   Estimated MRR:', overview.revenue.mrr, '\n');

        console.log('2️⃣ Getting Activation Funnel');
        const activation = await AdminMetricsService.getActivationFunnel();
        console.log('✅ Onboarded Tenants:', activation.funnel.onboarded);
        console.log('   Conversion Rate:', activation.conversionRates.registrationToOnboarded.toFixed(2), '%\n');

        console.log('3️⃣ Listing Tenants with advanced options');
        const tenants = await AdminDataService.listTenants({ limit: 3, page: 1, sort: 'name', sortDirection: 'desc' });
        console.log(`✅ Found ${tenants.total} tenants. Listed ${tenants.data.length}.\n`);

        if (tenants.data.length > 0) {
            console.log(`4️⃣ Getting Tenant 360 View for ${tenants.data[0].id}`);
            const details = await AdminDataService.getTenantAdminDetails(tenants.data[0].id);
            console.log(`✅ Usage Pct:`, details.usage.customers.pct.toFixed(2), '%');
            console.log(`✅ Upgrade Potential:`, details.insights.canUpgrade, '\n');
        }

        console.log('5️⃣ Listing Users');
        const users = await AdminDataService.listUsers({ limit: 2, page: 1 });
        console.log(`✅ Listed ${users.data.length} users.\n`);

        console.log('6️⃣ Listing Subscriptions');
        const subscriptions = await AdminDataService.listSubscriptions({ limit: 5, page: 1 });
        console.log(`✅ Listed ${subscriptions.data.length} subscriptions.\n`);

        console.log('🎉 DB / Service layer logic works perfectly!');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Service Test failed:', err);
        process.exit(1);
    }
}

runDirectTests();
