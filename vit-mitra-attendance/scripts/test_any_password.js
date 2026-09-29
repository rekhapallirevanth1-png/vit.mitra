async function testAnyPassword() {
  const adminRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', email: '24pa1a4297@vishnu.edu.in', password: 'xyz' })
  }).then(r => r.json());
  console.log('✓ Admin login with password="xyz":', adminRes.user?.name, '| Role:', adminRes.user?.role, '| CanEdit:', adminRes.user?.canEdit);

  const member1 = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'user', email: '24pa1a4507@vishnu.edu.in', password: 'myRandomPassword999' })
  }).then(r => r.json());
  console.log('✓ Member (A Lokesh) login with password="myRandomPassword999":', member1.user?.name, '| Role:', member1.user?.role, '| CanEdit:', member1.user?.canEdit);

  const member2 = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'user', email: '24PA1A4261', password: '1' })
  }).then(r => r.json());
  console.log('✓ Member (M Ratna Priyanka) login with password="1":', member2.user?.name, '| Role:', member2.user?.role, '| CanEdit:', member2.user?.canEdit);
}

testAnyPassword().catch(console.error);
