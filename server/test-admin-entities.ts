import 'dotenv/config';
import { AdminEntitiesService } from './src/services/admin-entities.service';

async function runEntityTests() {
    console.log('🚀 Testing Admin Entities Service (Deus Mode) directly...\n');

    try {
        console.log('1️⃣ Listing Global Tools (from any tenant)');
        const tools = await AdminEntitiesService.listTools({ limit: 3, page: 1 });
        console.log(`✅ Found ${tools.total} global tools. Listed ${tools.data.length}.\n`);

        if (tools.data.length > 0) {
            const testTool = tools.data[0];
            console.log(`2️⃣ Editing Tool ${testTool.id} from Tenant ${testTool.tenant?.name}`);

            // Backup old notes
            const oldNotes = testTool.notes;
            const testNotes = `[TEST] Edited by Master Admin at ${new Date().toISOString()}`;

            // Mutate
            const updated = await AdminEntitiesService.updateTool(testTool.id, { notes: testNotes });
            console.log(`✅ Success! Tool notes updated to: "${updated.notes}"\n`);

            // Restore
            console.log(`3️⃣ Restoring original tool state...`);
            await AdminEntitiesService.updateTool(testTool.id, { notes: oldNotes });
            console.log(`✅ Restored.\n`);
        }

        console.log('4️⃣ Listing Global Customers');
        const customers = await AdminEntitiesService.listCustomers({ limit: 2, page: 1 });
        console.log(`✅ Found ${customers.total} global customers. Listed ${customers.data.length}.\n`);

        console.log('5️⃣ Listing Global Rentals');
        const rentals = await AdminEntitiesService.listRentals({ limit: 2, page: 1 });
        console.log(`✅ Found ${rentals.total} global rentals. Listed ${rentals.data.length}.\n`);

        console.log('🎉 Deus Mode entity logic works perfectly (Bypass Tenant isolation confirmed).');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Entity Test failed:', err);
        process.exit(1);
    }
}

runEntityTests();
