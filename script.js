const url='http://localhost:4000/api';

let token=localStorage.getItem('token') || '';
let currentUser='';
//for sections
const login=document.getElementById('login');
const frontlook=document.getElementById('frontlook');
const group=document.getElementById('group-window');

const currentUserspan=document.getElementById('current-user');
const friendList=document.getElementById('friend-list');
const searchFriend=document.getElementById('search-friend');
const groupList=document.getElementById('group-list');
const expenseList=document.getElementById('expense-list');
const balanceList=document.getElementById('balance-list');
const groupName=document.getElementById('group-title');
const results = document.getElementById('results');
let currentGroup='';
let friends=[];

document.getElementById('login-btn').addEventListener('click', async ()=>{
    const username=document.getElementById('username').value;
    const password=document.getElementById('password').value;
    const response= await fetch(`${url}/users/login`,{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username,password})
    });
    const data=await response.json();
    if(data.token){
        token=data.token;
        localStorage.setItem('token',token);
        currentUser=username;
        showFrontlook();

    }
    else{
        alert('login failed');
    }

});
document.getElementById('register-btn').addEventListener('click', async ()=>{
    const username=document.getElementById('new-username').value;
    const password=document.getElementById('new-password').value;
    await fetch(`${url}/users/register`,{
        method: 'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username,password})
    });

    alert('Regsitered ! Please login now.');
});
async function showFrontlook(){
    login.style.display='none';
    frontlook.style.display='block';
    group.style.display='none';
    currentUserspan.textContent=currentUser;
    await showfriends();
    await groups();
}
document.getElementById('logout-btn').addEventListener('click', ()=>{
    token='';
    localStorage.removeItem('token');
    login.style.display='block';
    frontlook.style.display='none';
    group.style.display='none';
});
document.getElementById('search-btn').addEventListener('click', async ()=>{
    const q=document.getElementById('search-friend').value;
    const response=await fetch(`${url}/users/search?q=${q}`,{
        headers: {'x-auth-token':token}
    });
    const users= await response.json();
    results.innerHTML='';
    users.forEach(u=>{
        const li=document.createElement('li');
        li.textContent=u.username;
        const btn=document.createElement('button');
        btn.textContent='Add Friend';
        btn.onclick=()=> addFriend(u._id);
        li.appendChild(btn);
        results.appendChild(li);

    });

});
async function addFriend(id){
    await fetch(`${url}/users/friend/${id}`,{
        method :'POST',
        headers: {'x-auth-token':token}
    });
    await showfriends();
}
async function showfriends(){
    const response=await fetch(`${url}/users/search?q=${currentUser}`,{
        headers: {'x-auth-token':token}

    });
    const users= await response.json();
    const myself=users.find(u=>u.username===currentUser);
    friendList.innerHTML='';
    myself.friends.forEach(f=>{
        const li=document.createElement('li');
        li.textContent=f.username;
        const btn=document.createElement('button');
        btn.textContent='Unfriend';
        btn.onclick=()=> unfriend(f._id);
        li.appendChild(btn);
        friendList.appendChild(li);

    });
}
async function unfriend(id){
    await fetch(`${url}/users/friend/${id}`,{
        method: 'DELETE',
        headers: {'x-auth-token':token}
    });
    await showfriends();
}
document.getElementById('create-grp').addEventListener('click', async ()=>{
    const name=document.getElementById('group-name').value;
    const res= await fetch(`${url}/users/search?q=${currentUser}`,{
        headers: {'x-auth-token': token}
    });
    const users= await res.json();
    const myself=users.find(u=> u.username===currentUser);
    const ids=[myself._id, ...myself.friends.map(f=>f._id)];
    await fetch(`${url}/groups`,{
        method: 'POST',
        headers: {'Content-Type':'application/json','x-auth-token':token},
        body: JSON.stringify({name,members: ids})

    });
    await groups();

});
async function groups(){
    const res=await fetch(`${url}/groups`,{
        headers: {'x-auth-token': token}
    });
    const groups= await res.json();
    groupList.innerHTML='';
    groups.forEach(g=>{
        const li=document.createElement('li');
        li.textContent=g.name;
        li.onclick=()=> openGroup(g._id,g.name,g.members);
        groupList.appendChild(li);
    });
}
function openGroup(id,name,members){
    currentGroup=id;
    friends=members;
    groupName.textContent=name;
    frontlook.style.display='none';
    group.style.display='block';
    showExpense();
}
document.getElementById('back-btn').addEventListener('click',()=>{
    showFrontlook();
});
document.getElementById('add-amount').addEventListener('click', async()=>{
    const category= document.getElementById('category').value;
    const amount=parseFloat(document.getElementById('amount').value);
    await fetch(`${url}/expenses`,{
        method : 'POST',
        headers: {'Content-type': 'application/json', 'x-auth-token': token},
        body: JSON.stringify({groupId: currentGroup,category,amount})
    });
    showExpense();
});
async function showExpense(){
    const res=await fetch(`${url}/expenses/group/${currentGroup}`,{
        headers:{'x-auth-token':token}
    });
    const expenses=await res.json();
    expenseList.innerHTML='';
    let total=0;
    const balances={};

    expenses.forEach(e=>{
        total+=e.amount;
        balances[e.addedBy]=(balances[e.addedBy] || 0) + e.amount;

        const li=document.createElement('li');
        li.textContent=`${e.category}: $${e.amount}`;
        const btn=document.createElement('button');
        btn.textContent='delete';
        btn.onclick=()=> deleteExpense(e._id);
        li.appendChild(btn);
        expenseList.appendChild(li);
    });
    const share=total/friends.length;
    balanceList.innerHTML='';
    for (const userid in balances){
        const li=document.createElement('li');
        li.textContent=`User ${userid}: Paid $${balances[userid]}-Share $${share}= Owns $${(balances[userid]- share).toFixed(2)}`;
        balanceList.append(li);
    }
}
async function deleteExpense(id){
    await fetch(`${url}/expenses/${id}`, {
        method: 'DELETE',
        headers: {'x-auth-token': token}
    });
    showExpense();
}
document.getElementById('delete-grp').addEventListener('click', async ()=>{
    await fetch(`${url}/groups/${currentGroup}`,{
        method:'DELETE',
        headers: {'x-auth-token': token}
    });
    showFrontlook();

}) ;
