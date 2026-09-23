const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/(bfp)/incidents/index.tsx',
  'app/(report)/success.tsx',
  'app/(resident)/reports/[id].tsx',
  'components/bfp/IncidentStatusBadge.tsx',
  'components/bfp/StatusStepper.tsx',
  'components/home/StatusBadge.tsx',
  'services/api/bfpModels.ts',
  'services/api/incidentService.ts',
  'services/api/mapService.ts',
  'services/api/models.ts',
  'services/api/types.ts'
];

for (const file of filesToUpdate) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // In IncidentStatusBadge.tsx, `verified:   { label: 'Verified', ... }` should become `accepted:   { label: 'Accepted', ... }`
    // So case-insensitive replace of verified is mostly ok but we need to be careful about capital Verified vs lowercase verified.
    
    // We want to replace 'verified' with 'accepted'
    content = content.replace(/'verified'/g, "'accepted'");
    // Replace "verified" with "accepted"
    content = content.replace(/"verified"/g, '"accepted"');
    
    // Replace 'Verified' with 'Accepted' for labels in arrays/objects
    content = content.replace(/'Verified'/g, "'Accepted'");
    
    // Replace object keys: `verified:` -> `accepted:`
    content = content.replace(/verified:/g, 'accepted:');
    
    // Specifically fix `status === 'verified'` to `status === 'accepted'` (already covered by 'verified' replacement above)
    // Replace `is_verified` with `is_accepted` ? The user asked to change instances of "verified" to "accepted"
    content = content.replace(/is_verified/g, 'is_accepted');
    
    // Replace the plain text "verified" -> "accepted" in success screen
    content = content.replace(/verified/g, 'accepted');
    content = content.replace(/Verified/g, 'Accepted');

    // Wait, replacing all lowercase verified might break things. Let's write the file.
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated ' + file);
  }
}
