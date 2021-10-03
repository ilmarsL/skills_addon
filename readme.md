Small extension I started writing while learning javascript. It allows you to keep track of skills/technologies mentioned in job requirements. Saved data can later be used to visualize  relationships between those skills and potentially help to choose what to learn next.

## Installation
Signed extension can be found in signed folder. Currently works only on Firefox.

To install open Firefox and go to "Menu" -> "Add-ons and themes" -> "Extensions" -> "Gearbox icon"-> "Install Add-on From file".

## Usage
1. Open Job ad you are interested in (url is used to group skills). 
2. Highlight one of the skills that are required for it.
3. Click on Extension popup button ("S"), edit text if necessary, and then click "Add skill".
4. Optionally you can enter job title.
5. When all skills are entered, click "Save skills" button.

To view top skills and other stats related to them press 'Stats' button on extension popup("S").
Click on a skill you are interested  in to show its statistics.

By default, there are some demo skills, to demonstrate how extension works. You can enable/disable them using checkbox on stats page.

All data gats saved to local storage. It will get deleted if you clear all browsing data. To prevent that you can export saved data from stats page as .json file.