
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function verifyBackup() {
    console.log("Starting Backup Verification...");
    try {
        const response = await fetch('http://localhost:3500/api/projects/demo-project/backup');

        if (!response.ok) {
            throw new Error(`Failed to fetch backup: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save for manual inspection if needed
        const outputPath = path.join(__dirname, 'test_backup.zip');
        fs.writeFileSync(outputPath, buffer);
        console.log(`Saved backup to ${outputPath}`);
        console.log(`Size: ${buffer.length} bytes`);

        // Verify Contents
        const zip = await JSZip.loadAsync(buffer);
        console.log("\nZIP Contents:");

        let hasProjectJson = false;
        let hasManuscript = false;
        let fileCount = 0;

        zip.forEach((relativePath, file) => {
            console.log(` - ${relativePath}`);
            fileCount++;
            if (relativePath === "project.json") hasProjectJson = true;
            if (relativePath.startsWith("Manuscript/")) hasManuscript = true;
        });

        console.log("\nChecks:");
        console.log(` - Project.json found: ${hasProjectJson ? '✅' : '❌'}`);
        console.log(` - Manuscript folder found: ${hasManuscript ? '✅' : '❌'}`);
        console.log(` - Total Files: ${fileCount}`);

        if (hasProjectJson && hasManuscript && fileCount > 2) {
            console.log("\n✅ BACKUP VERIFICATION SUCCESSFUL");
        } else {
            console.error("\n❌ BACKUP VERIFICATION FAILED");
            process.exit(1);
        }

    } catch (error) {
        console.error("Verification Error:", error);
        process.exit(1);
    }
}

verifyBackup();
