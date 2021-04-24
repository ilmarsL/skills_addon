new Promise((resolve, reject) => {
    console.log('Initial');

    resolve();//what this, and how to reject
    //reject();
})
.then(() => {
    throw new Error('Something failed');

    console.log('Do this');
})
.catch(() => {
    console.error('Do that');
})
.then(() => {
    console.log('Do this, no matter what happened before');
});
