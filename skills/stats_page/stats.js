var loadedSkillsArray;
var cy;

$( document ).ready(function(){
    const displayGraphButon = document.querySelector('#display-graph');
    //Initialize on open
    browser.storage.local.get(['skills', 'useDemo'])
        .then((skillsData) => {
            if(!skillsData.hasOwnProperty('skills')){
                //No 'skills' key in storage
                console.log('No saved data found in local storage.');
                //check if use-demo is set
                if(!skillsData.hasOwnProperty('useDemo') || skillsData.useDemo){
                    //useDemo not set or set to true, use demo
                    if (!window.hasOwnProperty('demoSkills')){
                        console.log('Demo skills file not found!');
                        return;
                    }
                    console.log('Using demo data')
                    //use-demo key not set, probably first run, using demo-data.
                    loadedSkillsArray = JSON.parse(JSON.stringify(demoSkills.skills));//deep copy
                    skillsData.skills = loadedSkillsArray
                    showAllEntries(loadedSkillsArray);
                    countSkills(loadedSkillsArray);
                    //check the demo box
                    document.getElementById('demo-data').checked = true;
                    displayGraphButon.removeAttribute('disabled');
                    browser.storage.local.set({'useDemo' : true})
                    .catch((error)=>{
                        console.log('Failed to set useDemo in localStorage');
                        console.log(error);
                    });
                }
                else{
                    console.log('Not using demo data');
                    return;
                }                         
            }
            else if (skillsData.hasOwnProperty('skills')){
                //skillsData exists in storage, check demo flag
                if (!skillsData.hasOwnProperty('useDemo')){
                    //no demo property, probably first run, use demo
                    console.log('No demo!!!, adding demo data');
                    let demoCheckBox = document.getElementById('demo-data');
                    demoCheckBox.checked = true;
                    browser.storage.local.set({'useDemo' : true})
                    .then(()=>{
                            //demo data should be used
                            console.log('Adding demo items...');
                            loadedSkillsArray = skillsData.skills;
                            let loadedDemoSkills = JSON.parse(JSON.stringify(demoSkills.skills));//deep copy
                            loadedSkillsArray = loadedSkillsArray.concat(loadedDemoSkills);
                            showAllEntries(loadedSkillsArray);
                            countSkills(loadedSkillsArray);
                            //save data
                            browser.storage.local.set({ 'skills': loadedSkillsArray }); //TODO re-write this to properly use promises
                            displayGraphButon.removeAttribute('disabled');
                    })
                    .catch((e)=>{
                        console.log('Failed to set demo');
                        console.log(e);
                    });
                }
                else{
                    //skills already exist in local storage
                    //just show everything
                    showAllEntries(skillsData.skills);
                    countSkills(skillsData.skills);
                    loadedSkillsArray = skillsData.skills;
                    displayGraphButon.removeAttribute('disabled');
                }             
            } 
        })
        .catch((e) => {
            console.log("Initialization error");
            console.log(e);
        });

    //Export file
    document.getElementById('export-button').addEventListener('click',() => {
        if(loadedSkillsArray === undefined){
            console.error('No data to export');
            return;
        }
        console.log('Exporting...');
        const blob = new Blob([JSON.stringify(loadedSkillsArray)], { type: "text/json" });
        const link = document.createElement("a");

        link.download = 'mySkils.json';
        link.href = window.URL.createObjectURL(blob);
        link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

        const evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });

        link.dispatchEvent(evt);
        link.remove()
    }); 

    //Upload file
    document.getElementById('import-button').addEventListener('change', handleFiles, false);
        function handleFiles(){
            console.log('Importing...');
            const filelist = this.files;
            const selectedFile = filelist[0];
            selectedFile.text().then((text) => {
                console.log('contents of the file:');
                console.log(text);
                try{
                    var skillsObj = JSON.parse(text);
                    console.log('parsed file:');
                    console.log(skillsObj);
                }catch(e){
                    console.log('Error parsing file');
                    console.log(e);
                    return;
                }
                browser.storage.local.set({'skills' : skillsObj})
                .then(() => {
                    loadedSkillsArray = skillsObj;
                    showAllEntries(skillsObj);
                    countSkills(skillsObj);
                    console.log('Skills set');
                });         
            })
            .catch(()=>{
                console.log('Error processing file;');
            });
        }
    
    //Close edit box handler
    $('#close-button').on('click', ()=>{
        console.log('Closing modal');
        $('#edit-skill-modal').modal('hide');
    });
    $('#save-button').on('click',saveEditedSkill);

    //show all link
    document.getElementById('show-all').addEventListener('click', (e)=>{
        console.log('Showing all skills');
        document.getElementById('skill-count-row').style.maxHeight = '100%';
        e.target.style.display = 'none';
    });

    //use demo skills checkbox
    document.getElementById('demo-data').addEventListener('change', (e)=>{        
        console.log('Checkbox changed')
        browser.storage.local.set({'useDemo' : e.target.checked})
                .then(()=>{
                    console.log('useDemo set to: ' + e.target.checked);
                    if(e.target.checked){
                        //demo data should be used
                        console.log('Adding demo items...');
                        let loadedDemoSkills = JSON.parse(JSON.stringify(demoSkills.skills));//deep copy
                        if (loadedSkillsArray === undefined){
                            loadedSkillsArray = loadedDemoSkills
                        }
                        else{
                            loadedSkillsArray = loadedSkillsArray.concat(loadedDemoSkills);
                        }                        
                        showAllEntries(loadedSkillsArray);
                        countSkills(loadedSkillsArray);
                        showGraph();
                        //store new demo state to local storage
                    }
                    else if(!e.target.checked){
                        //remove all demo data
                        console.log('Removing demo items...');
                        for (let i = 0; i < loadedSkillsArray.length; i++){
                            if(loadedSkillsArray[i].uri.substr(0,4) === 'demo'){
                                loadedSkillsArray.splice(i,1);
                                i--;
                            }
                        }
                        showAllEntries(loadedSkillsArray);
                        countSkills(loadedSkillsArray);
                        showGraph();
                    }
                })
                .catch((error)=>{
                    console.log(error);
                    console.log('Failed to write to localstorage!');
                });  
    });

    displayGraphButon.addEventListener('click', () =>{
        const cyRow = document.querySelector('#cy-container-row');
        cyRow.style.display = 'flex';
        showGraph();
    });
});//end of ready()

/**
 * Displays all entries of skills on addon page.
 */
function showAllEntries(skillsArray){
    let curSkillContainer = document.getElementById('all-skills-tbody');
    curSkillContainer.innerHTML = '';
    for (var i = 0; i < skillsArray.length; i++){    
        let newRow = document.createElement('tr');
        let newSkillName = document.createElement('td');
        newSkillName.innerText = skillsArray[i].skillName;
        newRow.append(newSkillName);

        let newURLdata = document.createElement('td');
        let newURL = document.createElement('a');
        newURL.href = skillsArray[i].uri;
        newURL.innerText = skillsArray[i].uri.substr(0,65);
        newURLdata.append(newURL);
        newRow.append(newURLdata);

        let newJobTitle = document.createElement('td');
        newJobTitle.innerText = skillsArray[i].jobTitle;
        newRow.append(newJobTitle);

        let newDate = document.createElement('td');
        saveDate = new Date(skillsArray[i].date);
        
        newDate.innerText = saveDate.getFullYear() + '-' 
        + ((((saveDate.getMonth()+1) < 10) ? ('0' + (saveDate.getMonth() + 1).toString()) : (saveDate.getMonth() + 1).toString())) + '-' 
        + ((saveDate.getDate() < 10) ? ('0' + saveDate.getDate().toString()) : saveDate.getDate().toString()) + ' ' 
        + ((saveDate.getHours() < 10) ? ('0' + saveDate.getHours().toString()) : saveDate.getHours().toString()) + ':' 
        + ((saveDate.getMinutes() < 10) ? ('0' + saveDate.getMinutes().toString()) : saveDate.getMinutes().toString());

        newRow.append(newDate);
        curSkillContainer.append(newRow);

        let editButtonCell = document.createElement('td');
        let editButton = document.createElement('button');
        editButton.innerText = 'Edit';
        editButton.onclick = editSkill;
        editButton.setAttribute('data-arrayIndex', i);
        editButtonCell.append(editButton);
        newRow.append(editButtonCell);

        let deleteButtonCell = document.createElement('td');
        let deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.onclick = deleteSkill;
        deleteButton.setAttribute('data-arrayIndex', i);
        deleteButtonCell.append(deleteButton)
        newRow.append(deleteButtonCell);
    }
}

/**
 * Counts skill stats and displays them on stats page
 * @param {array from localstorage} skillsArray 
 */
function countSkills(skillsArray){
    
    console.log('Counting skills');
    //count duplicates
    let countedSkills = []; //array of objects {skillName, skillCount}
    let currentURL = ''
    
    for (var i = 0; i < skillsArray.length; i++){
        //check if element already in countedSkills  
        const found = countedSkills.findIndex(element => element.skillName.toLowerCase() == skillsArray[i].skillName.toLowerCase());
        //console.log('found: ' + found);
        if (found != -1){
            //console.log('increasing index; ');
            countedSkills[found].skillCount += 1;
        }
        else{
            newSkill = {
                'skillName': skillsArray[i].skillName,
                'skillCount': 1
            }
            countedSkills.push(newSkill);
        }        
    }
    //sort countedSkills
    countedSkills.sort(function(a, b){
        return b.skillCount - a.skillCount;
    });
    //print it all
    let sortedSkillContainer = document.getElementById('sorted-skills-container');
    sortedSkillContainer.innerHTML = '';
    for (var i = 0; i < countedSkills.length; i++){
        let newRow = document.createElement('tr');
        let newSkillName = document.createElement('td');
        newSkillName.className += 'skill-name';
        newSkillName.onclick = showRelatedSkills;
        let newCount = document.createElement('td');
        newSkillName.innerText = countedSkills[i].skillName;
        newCount.innerText = countedSkills[i].skillCount;
        newRow.append(newSkillName);
        newRow.append(newCount);
        sortedSkillContainer.append(newRow);    
    }
}

function editSkill(e){
    console.log('Editing skill');
    console.log(e);
    //get row values
    let skillName = e.target.parentElement.parentElement.childNodes[0].innerText;
    let skillURL = e.target.parentElement.parentElement.childNodes[1].firstChild.href;
    let jobTitle = e.target.parentElement.parentElement.childNodes[2].innerText;
    const skillDate = new Date(e.target.parentElement.parentElement.childNodes[3].innerText);
    $('#skill-name').val(skillName);
    if(skillURL.indexOf('demo') !== -1){
        //fix for demo skills 
        $('#skill-url').val(skillURL.substr(skillURL.indexOf('demo')));
    }
    else{
        $('#skill-url').val(skillURL);
    }    
    $('#job-title').val(jobTitle);
    
    //Set date and time fields
    document.getElementById('save-date').valueAsDate = skillDate;

    const timeString = ((skillDate.getHours() < 10) ? ('0' + skillDate.getHours()) : skillDate.getHours()) + ':' + 
    ((skillDate.getMinutes() < 10) ? ('0' + skillDate.getMinutes()) : skillDate.getMinutes());
    
    document.getElementById('save-time').value = timeString;

    //set id for later use with save button
    $('#save-button').attr('data-arrayIndex', e.target.getAttribute('data-arrayIndex'));
    $('#edit-skill-modal').modal('show');
}

/**
 * Handler for delete button
 * @param {*} e 
 */
function deleteSkill(e){
    let aIndex = e.target.getAttribute('data-arrayIndex');
    console.log('Deleteing skill ' + aIndex);
    loadedSkillsArray.splice(aIndex,1);
    browser.storage.local.set({ 'skills': loadedSkillsArray })
            .then(() => {
                showAllEntries(loadedSkillsArray);
                countSkills(loadedSkillsArray);              
            })
            .catch((error)=>{
                console.error(error);
                console.log('Error saving to local storage!');
            });
}

//Called when save button on modal is pressed
function saveEditedSkill(){
    let aIndex = $('#save-button').attr('data-arrayIndex');
    
    loadedSkillsArray[aIndex].skillName = $('#skill-name').val();
    loadedSkillsArray[aIndex].uri = $('#skill-url').val();
    loadedSkillsArray[aIndex].jobTitle = $('#job-title').val();

    //Date format YYYY-MM-DD HH:mm
    const dateString = document.getElementById('save-date').value;
    const timeString = document.getElementById('save-time').value;
    loadedSkillsArray[aIndex].date = dateString + ' ' + timeString;

    //save everything and reload
    browser.storage.local.set({ 'skills': loadedSkillsArray })
            .then(() => {
                showAllEntries(loadedSkillsArray);
                countSkills(loadedSkillsArray);
                $('#edit-skill-modal').modal('hide');                
            })
            .catch((error)=>{
                console.error(error);
                console.log('Error saving to local storage!');
            });
}

function showRelatedSkills(e){
    //remove selection from other elements
    console.log(e);
    e.target.parentNode.parentNode.childNodes.forEach(elem =>{
        if(elem.childNodes[0].classList.contains('selected-skill'))
            elem.childNodes[0].classList.remove('selected-skill');
    })
    e.target.classList.add('selected-skill');
    let selectedSkill = e.target.innerText; //skill user clicked on    

    //get all unique skills with this name
    let skillWithURL = loadedSkillsArray.filter(elem=>{
        return elem.skillName.toLowerCase() ===  selectedSkill.toLowerCase()
    });

    let skillURLS = []; //array of skill url strings
    let jobTitles = []; //array of job title strings
    for (let i = 0; i < skillWithURL.length; i++){
        skillURLS.push(skillWithURL[i].uri);
        jobTitles.push(skillWithURL[i].jobTitle)
    }

    //get all related (skills with this job url)
    let relatedSkills = loadedSkillsArray.filter(elem=>{
        if (elem.skillName.toLowerCase() !== selectedSkill.toLowerCase()) //don't show the skill user clicked on
            return skillURLS.includes(elem.uri);
    });

    //count related skills and remove duplicates.
    let countedSkills = []; //array of objects {skillName, skillCount}    
    for (let j = 0; j < relatedSkills.length; j++){
        //check if element already in countedSkills  
        const found = countedSkills.findIndex(element => element.skillName.toLowerCase() == relatedSkills[j].skillName.toLowerCase());
        if (found != -1){
            //if it is already found, increase it's count
            countedSkills[found].skillCount += 1;
        }
        else{
            newSkill = {
                'skillName': relatedSkills[j].skillName,
                'skillCount': 1
            }
            countedSkills.push(newSkill);
        }
    }

    //sort countedSkills in descending order
    countedSkills.sort(function(a, b){
        return b.skillCount - a.skillCount;
    });

    //Display results
    document.getElementById('related-skill-heading').childNodes[1].innerText = selectedSkill;
    let sortedSkillContainer = document.getElementById('related-skills-container');
    sortedSkillContainer.innerHTML = '';
    for (let k = 0; k < countedSkills.length; k++){
        let newRow = document.createElement('tr');
        let newSkillName = document.createElement('td');
        let newCount = document.createElement('td');
        newSkillName.innerText = countedSkills[k].skillName;
        newCount.innerText = countedSkills[k].skillCount;
        newRow.append(newSkillName);
        newRow.append(newCount);
        sortedSkillContainer.append(newRow);    
    }
    //show the table
    const relatedTable = document.getElementById('related-skill-counts');
    if(relatedTable.classList.contains('hidden')){
        relatedTable.classList.remove('hidden');
    }

    console.log('jobTitles');
    console.log(jobTitles);

    //count JobTitles
    let countedJobTitles = []; //array of objects {skillName, skillCount}    
    for (let j = 0; j < jobTitles.length; j++){
        //check for undefined 
        if (jobTitles[j] === undefined){
            console.log('found undefined');
            jobTitles[j] = '';
        }
        //check if element already in countedSkills  
        const found = countedJobTitles.findIndex(element => element.skillName.toLowerCase() == jobTitles[j].toLowerCase());
        if (found != -1){
            //if it is already found, increase it's count
            countedJobTitles[found].count += 1;
        }
        else{
            newJobTitle = {
                'skillName': jobTitles[j],
                'count': 1
            }
            countedJobTitles.push(newJobTitle);
        }
    }

    //sort countedSkills in descending order
    countedJobTitles.sort(function(a, b){
        return b.count - a.count;
    });
    console.log('countedJobTitles');
    console.log(countedJobTitles);

    //display job titles
    document.getElementById('related-jobs-heading').childNodes[1].innerText = selectedSkill;
    let sortedJobsContainer = document.getElementById('related-jobs-container');
    sortedJobsContainer.innerHTML = '';
    for (let k = 0; k < countedJobTitles.length; k++){
        let newRow = document.createElement('tr');
        let newSkillName = document.createElement('td');
        newSkillName.className += 'skill-name';
        let newCount = document.createElement('td');
        newSkillName.innerText = countedJobTitles[k].skillName;
        newCount.innerText = countedJobTitles[k].count;
        newRow.append(newSkillName);
        newRow.append(newCount);
        sortedJobsContainer.append(newRow);    
    }
    //show the table
    const relatedJobsTable = document.getElementById('related-jobs-counts');
    if(relatedJobsTable.classList.contains('hidden')){
        relatedJobsTable.classList.remove('hidden');
    }
}

function showGraph(){
    //count duplicates
    let countedSkills = []; //array of objects {skillName, skillCount}
    let currentURL = ''
    //graph
    cy = window.cy = cytoscape({
        container: document.getElementById('cy'), // container to render in  
        style: [ // the stylesheet for the graph
            {
            selector: 'node',
            style: {
                'background-color': '#666',
                'label': 'data(id)'
            }
            },
        
            {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
            }
        ],    
        layout: {
            name: 'random'
        }
    });
    
    //add nodes
    for (var i = 0; i < loadedSkillsArray.length; i++){
        //check if element already in countedSkills  
        const found = countedSkills.findIndex(element => element.skillName.toLowerCase() == loadedSkillsArray[i].skillName.toLowerCase());
        //console.log('found: ' + found);
        if (found != -1){
            //console.log('increasing index; ');
            countedSkills[found].skillCount += 1;
            //increase the size of the node.
            console.log('Increasing size');
            //let incNode = cy.getElementById(loadedSkillsArray[i].skillName.toLowerCase());
            //incNode.data('size', parseInt(incNode.data('size')) + 50); 
        }
        else{
            newSkill = {
                'skillName': loadedSkillsArray[i].skillName,
                'skillCount': 1
            }
            countedSkills.push(newSkill);

            //add to graph            
            if(loadedSkillsArray[i].skillName !== ''){
                cy.add({
                group: 'nodes',
                data: {id: loadedSkillsArray[i].skillName.toLowerCase(),
                    weight: 75}
                });
            }
        }        
    }

    //second loop for adding edges to graph
    let sameJobSkills = [];
    for (var i = 0; i < loadedSkillsArray.length; i++){
        if(loadedSkillsArray[i].uri !== currentURL){
            //next job started
            sameJobSkills = [];
        }        
        sameJobSkills.push(loadedSkillsArray[i].skillName);
        if(sameJobSkills.length > 1){
            for (let j = 0; j < sameJobSkills.length; j++){
                if(loadedSkillsArray[i].skillName.toLowerCase() !== sameJobSkills[j].toLowerCase()){
                    //check if nodes already connected
                    let node1 = cy.getElementById(loadedSkillsArray[i].skillName.toLowerCase());
                    let node2 = cy.getElementById(sameJobSkills[j].toLowerCase());
                    if(node1.edgesWith(node2).length > 0){
                        continue;
                    }
                    else{
                        cy.add({ group: 'edges', data: { 
                            id: loadedSkillsArray[i].skillName.toLowerCase() + i + j, 
                            source: loadedSkillsArray[i].skillName.toLowerCase(), 
                            target: sameJobSkills[j].toLowerCase()}});
                    }                    
                }
            }
        }
        currentURL = loadedSkillsArray[i].uri;
    }
    var layout = cy.layout({
        name: 'cose', //concentric, breadthfirst, cose, cose-bilkent
        padding: 40,
        nodeRepulsion: 1600000,
        idealEdgeLength: 100,
        edgeElasticity: 150,
      });
  
    layout.run();    

    //add panzoom widget
    cy.panzoom({});
}