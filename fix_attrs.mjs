import fs from 'fs';
import path from 'path';

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir('app').filter(f => f.endsWith('.tsx'));
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/disabled=""/g, 'disabled');
  content = content.replace(/required=""/g, 'required');
  content = content.replace(/checked=""/g, 'defaultChecked');
  content = content.replace(/selected=""/g, 'defaultValue');
  fs.writeFileSync(file, content);
});

console.log('Fixed boolean attributes.');
