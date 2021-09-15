var loadedSkillsArray;

$( document ).ready(function(){
    //Initialize on open
    browser.storage.local.get('skills')
        .then((skillsData) => {
            if(Object.keys(skillsData).length === 0){
                //No 'skills' key in storage
                console.log('No saved data found in local storage.');
                return;
            }
            showAllEntries(skillsData.skills);
            countSkills(skillsData.skills);
            loadedSkillsArray = skillsData.skills;

            //Export skills
            document.getElementById('export-button').addEventListener('click',() => {
                console.log('Exporting...');
                const blob = new Blob([JSON.stringify(skillsData)], { type: "text/json" });
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
    }).catch((e) => {
        console.log("Initialization error");
        console.log(e);
    });

    //Upload file
    document.getElementById('import-button').addEventListener('change', handleFiles, false);
        function handleFiles(){
            console.log('Importing...');
            const filelist = this.files;
            const selectedFile = filelist[0];
            selectedFile.text().then(text => {
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
                browser.storage.local.set({'skills' : skillsObj.skills})
                .then(() => {
                    loadedSkillsArray = skillsObj.skills;
                    showAllEntries(skillsObj.skills);
                    countSkills(skillsObj.skills);
                    console.log('Skills set');
                });         
            });
        }
    
    //Close edit box handler
    $('#closeButton').on('click', ()=>{
        console.log('Closing modal');
        $('#exampleModal').modal('hide');
    });
    $('#saveButton').on('click',saveEditedSkill);
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
        newDate.innerText = skillsArray[i].date;
        newRow.append(newDate);
        curSkillContainer.append(newRow);

        let editButton = document.createElement('button');
        editButton.innerText = 'Edit';
        editButton.onclick = editSkill;
        editButton.setAttribute('data-arrayIndex', i);
        newRow.append(editButton);
    }
}

/**
 * Counts skill stats and displays them on stats page
 * @param {array from localstorage} skillsArray 
 */
function countSkills(skillsArray){
    console.log('Counting skills');
    //count duplicates
    countedSkills = [];
    
    for (var i = 0; i < skillsArray.length; i++){
        //check if element alreadu exists  
        const found = countedSkills.findIndex(element => element.skillName.toLowerCase() == skillsArray[i].skillName.toLowerCase());
        console.log('found: ' + found);
        if (found != -1){
            console.log('increasing index; ');
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
    let skillName = e.target.parentElement.childNodes[0].innerText;
    let skillURL = e.target.parentElement.childNodes[1].firstChild.href;
    let jobTitle = e.target.parentElement.childNodes[2].innerText;
    let skillDate = e.target.parentElement.childNodes[3].innerText;
    $('#skillNameEdit').val(skillName);
    $('#skillURLEdit').val(skillURL);
    $('#skillJTitleEdit').val(jobTitle);
    console.log('Setting date to' + skillDate);
    document.getElementById('skillDateEdit').valueAsDate = new Date(skillDate);
    console.log(skillName);
    console.log(skillURL);
    //set id for later use with save button
    $('#saveButton').attr('data-arrayIndex', e.target.getAttribute('data-arrayIndex'));
    $('#exampleModal').modal('show');
}

//Called when save button on modal is pressed
function saveEditedSkill(){
    let aIndex = $('#saveButton').attr('data-arrayIndex');
    console.log(aIndex);
    console.log(loadedSkillsArray);
    loadedSkillsArray[aIndex].skillName = $('#skillNameEdit').val();
    loadedSkillsArray[aIndex].uri = $('#skillURLEdit').val();
    loadedSkillsArray[aIndex].jobTitle = $('#skillJTitleEdit').val();
    loadedSkillsArray[aIndex].date = $('#skillDateEdit').val();
    //save everything and reload
    browser.storage.local.set({ 'skills': loadedSkillsArray })
            .then(() => {
                showAllEntries(loadedSkillsArray);
                countSkills(loadedSkillsArray);
                $('#exampleModal').modal('hide');                
            })
            .catch((error)=>{
                console.error(error);
                console.log('Error saving to local storage!');
            });
}