import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { networkInterfaces } from 'os';
import swal from 'sweetalert2';
import { all } from 'q';

@Component({
  selector: 'app-current-sprint',
  templateUrl: './current-sprint.component.html',
  styleUrls: ['./current-sprint.component.css']
})

export class CurrentSprintComponent implements OnInit {
  project: any;
  currentSprint: any;
  currentUserStories: any;
  selectedUserStory: any;
  displayAllTasksDialog: boolean;
  displayAddTaskDialog: boolean;
  displaySetRange: boolean;
  displayEdit: boolean;
  displayAnalysis: boolean;
  selectedUserStoryTasks: any;
  newTaskName: FormControl;
  createNewTaskForm: FormGroup;
  projectId: any;
  highLowerRange: FormControl;
  medLowerRange: FormControl;
  medUpperRange: FormControl;
  lowUpperRange: FormControl;
  createRangeForm: FormGroup;
  ac: FormControl;
  ev: FormControl;
  pv: FormControl;
  editValueForm: FormGroup;
  task: any;
  currWorkload: any;
  warningMessage: any;


  constructor(
    private route: ActivatedRoute
  ) {

  }

  ngOnInit() {
    this.createFormControl();
    this.createForm();
    this.createEditValueForm();
    this.route.params.subscribe(
      params => {
        this.projectId = params.projectId;
        this.project = JSON.parse(localStorage.getItem(this.projectId));
        const latestSprint = this.project.default.sprints.length;
        this.currentSprint = this.project.default.sprints[latestSprint - 1];
        this.currentUserStories = this.currentSprint.userStories;
        console.log('cur sprint', this.currentSprint);
      }
    )
  }

  openEdit(event: Event, task: any) {
    this.task = task;
    this.displayEdit = true;
    event.preventDefault();
    this.editValueForm.patchValue({ "ac": task.AC });
    this.editValueForm.patchValue({ "pv": task.PV });
    this.editValueForm.patchValue({ "ev": task.EV });
  }

  closeEdit() {
    this.displayEdit = false;
    this.task = null;
  }

  openSetRange(event: Event) {
    this.displaySetRange = true;
    event.preventDefault();
  }

  closeSetRange() {
    this.displaySetRange = false;
  }

  selectUserStory(event: Event, userStory: any) {
    this.selectedUserStory = userStory;
    this.displayAllTasksDialog = true;
    event.preventDefault();
  }

  closeAllTasks() {
    this.selectedUserStory = null;
    this.displayAllTasksDialog = false;
  }

  openAddTask(event: Event, userStory: any) {
    this.selectedUserStory = userStory;
    this.displayAddTaskDialog = true;
    event.preventDefault();
  }

  closeAddTask() {
    this.selectedUserStory = null;
    this.displayAddTaskDialog = false;
  }

  closeAnalysis() {
    this.selectedUserStory = null;
    this.displayAnalysis = false;
    this.closeAddTask();
  }

  createEditValueControl() {
    this.ac = new FormControl('', {
      updateOn: 'change'
    });
    this.pv = new FormControl('', {
      updateOn: 'change'
    });
    this.ev = new FormControl('', {
      updateOn: 'change'
    })
  }

  createFormControl() {
    this.newTaskName = new FormControl('', {
      updateOn: 'change'
    })
    this.pv = new FormControl('', {
      updateOn: 'change'
    })
    if (localStorage.getItem('range') === null) {
      this.highLowerRange = new FormControl(0, {
        updateOn: 'change'
      })
      this.medLowerRange = new FormControl(0, {
        updateOn: 'change'
      })
      this.medUpperRange = new FormControl(0, {
        updateOn: 'change'
      })
      this.lowUpperRange = new FormControl(0, {
        updateOn: 'change'
      })
    } else {
      this.highLowerRange = new FormControl(JSON.parse(localStorage.getItem("range")).higherLower, {
        updateOn: 'change'
      })
      this.medLowerRange = new FormControl(JSON.parse(localStorage.getItem("range")).medLower, {
        updateOn: 'change'
      })
      this.medUpperRange = new FormControl(JSON.parse(localStorage.getItem("range")).medUpper, {
        updateOn: 'change'
      })
      this.lowUpperRange = new FormControl(JSON.parse(localStorage.getItem("range")).lowerUpper, {
        updateOn: 'change'
      })
    }
    this.createEditValueControl();
  }

  createForm() {
    this.createNewTaskForm = new FormGroup({
      newTaskName: this.newTaskName,
      pv: this.pv
    });
    this.createRangeForm = new FormGroup({
      highLowerRange: this.highLowerRange,
      medLowerRange: this.medLowerRange,
      medUpperRange: this.medUpperRange,
      lowUpperRange: this.lowUpperRange,
    });
  }

  createEditValueForm() {
    this.editValueForm = new FormGroup({
      ac: this.ac,
      ev: this.ev,
    })

  }

  analyse() {
    if (this.createNewTaskForm.valid) {
      this.displayAnalysis = true;
      const pv = this.createNewTaskForm.value.pv;
      const range = JSON.parse(localStorage.getItem("range"));
      const hl = range.higherLower;
      const mu = range.medUpper;
      const ml = range.medLower;
      const lu = range.lowerUpper;
      var currWorkloadWithNewTask = 0;

      //find current sprint workload with new task
      for (var i = 0; i < this.currentSprint.userStories.length; i++) {
        for (var j = 0; j < this.currentSprint.userStories[i].tasks.length; j++) {
          currWorkloadWithNewTask += this.currentSprint.userStories[i].tasks[j].PV;
        }
      }
      currWorkloadWithNewTask += pv;

      //check if its high or low
      if (currWorkloadWithNewTask >= hl) {
        this.currWorkload = "High";
      } else if (currWorkloadWithNewTask <= mu && currWorkloadWithNewTask >= ml) {
        this.currWorkload = "Medium";
      } else if (currWorkloadWithNewTask <= lu && currWorkloadWithNewTask >= 1) {
        this.currWorkload = "Low";
      }

      //get all project sprints
      const allProj = [];
      for (let i = 1; i <= localStorage.length; i++) {
        var project = JSON.parse(localStorage.getItem(i.toString()))
        if (project !== null) {
          allProj.push(project);
        }
      }

      //filter out past sprints that have same workload
      // const pastSprints = this.project.default.sprints;
      // const sameWorkload = [];
      const sameWorkloadProj = [];

      outer:
      for (var i = 0; i < allProj.length; i++) {
        var currProj = allProj[i]
        var allSprints = allProj[i].default.sprints;
        inner:
        for (var j = 0; j < allProj[i].default.sprints.length - 1; j++) {
          var workload;
          var sprint = allSprints[j];
          if (sprint.totalPV >= hl) {
            workload = "High";
          } else if (sprint.totalPV <= mu && sprint.totalPV >= ml) {
            workload = "Medium";
          } else if (sprint.totalPV <= lu && sprint.totalPV >= 1) {
            workload = "Low";
          }
          console.log(workload)
          // once encounter sprint of similar workload, will push proj into sameworkloadproj and exit inner loop
          // and go to the next proj to find. this is to prevent double count 
          if (workload === this.currWorkload) {
            sameWorkloadProj.push(currProj);
            break inner;
          }
        }
      }

      // for (var i = 0; i < pastSprints.length - 1; i++) {
      //   const sprint = pastSprints[i];
      //   var workload;
      //   if (sprint.totalPV >= hl) {
      //     workload = "High";
      //   } else if (sprint.totalPV <= mu && sprint.totalPV >= ml) {
      //     workload = "Medium";
      //   } else if (sprint.totalPV <= lu && sprint.totalPV >= 1) {
      //     workload = "Low";
      //   }
      //   if (workload === this.currWorkload) {
      //     sameWorkload.push(sprint);
      //   }
      // }


      //calculate number of overbudget and/or behind schedule userstories
      const numberOfProjs = sameWorkloadProj.length;
      if (numberOfProjs === 0) {
        this.warningMessage = "<p>You have no Sprints in any other projects that are of similar workload.</p> <br> Please click submit to continue.";
        return;
      }

      // var sprintNum = [];
      // var behind = [];
      // var over = [];

      var analysis = [];

      for (var i = 0; i < sameWorkloadProj.length; i++) {
        var project = sameWorkloadProj[i];
        var sprints = project.default.sprints;
        for (var j = 0; j < sprints.length - 1; j++) {
          var sprint = sprints[j];
          var overbudget = 0;
          var behindSchedule = 0;
          for (var k = 0; k < sprint.userStories.length; k++) {
            var userStory = sprint.userStories[k];
            if (userStory.totalEV / userStory.totalPV < 1) {
              behindSchedule += 1;
            }
            if (userStory.totalEV / userStory.totalAC < 1) {
              overbudget += 1;
            }
          }
          if (behindSchedule !== 0 || overbudget !== 0) {
            var projAnalysis = {
              projName: project.default.title,
              sprintNum: sprint.sprintNum,
              overbudget: overbudget,
              behindSchedule: behindSchedule
            }
            analysis.push(projAnalysis)
          }
        }
      }
      console.log(analysis)

      // for (var i = 0; i < sameWorkload.length; i++) {
      //   var overbudget = 0;
      //   var behindSchedule = 0;
      //   sprintNum.push(sameWorkload[i].sprintNum)
      //   for (var j = 0; j < sameWorkload[i].userStories.length; j++) {
      //     const userStory = sameWorkload[i].userStories[j];
      //     if (userStory.totalEV / userStory.totalPV < 1) {
      //       behindSchedule += 1;
      //     }
      //     if (userStory.totalEV / userStory.totalAC < 1) {
      //       overbudget += 1;
      //     }
      //   }
      //   behind.push(behindSchedule);
      //   over.push(overbudget);
      // }

      // var overOrBehind = false;
      // for (var i = 0; i < sprintNum.length; i++) {
      //   if ((behind[i] > 0) || (over[i] > 0)) {
      //     overOrBehind = true;
      //   }
      // }

      if (numberOfProjs !== 0 && analysis.length === 0) {
        this.warningMessage = "<p>Past Sprints from all projects with similar workload suggest that you were able able to complete the intended workload of this Sprint.</p> <br> Click submit to continue."
        return;
      }

      this.warningMessage = "<p>Based on past Sprints from other projects with similar workload as the current Sprint:</p> <br> "
      for (var i = 0; i < analysis.length; i++) {
        this.warningMessage += "<p>Project: <b>" + analysis[i].projName + "</b> Sprint <b>" + analysis[i].sprintNum + "</b> has <b>" + analysis[i].behindSchedule + "</b> user story behind schedule and <b>" + analysis[i].overbudget + "</b> user story over budget. </p> <br>";
      }
      this.warningMessage += "<br> <p>Are you sure you want to add this task with the man-hours entered?</p>";
    }
  }

  onSubmitNewTask() {
    this.createJSONTaskObject(this.createNewTaskForm.value.newTaskName, this.createNewTaskForm.value.pv, this.selectedUserStory);
    this.closeAddTask();
    this.closeAnalysis();
    swal.fire({
      type: 'success',
      title: "Task Added",

    }).then(() => {

      // this.dialog.closeAll();
    }

    )
  }

  onSubmitRange() {
    if (this.createNewTaskForm.valid) {
      const highLowerRange = this.createRangeForm.value.highLowerRange;
      const medUpperRange = this.createRangeForm.value.medUpperRange;
      const medLowerRange = this.createRangeForm.value.medLowerRange;
      const lowUpperRange = this.createRangeForm.value.lowUpperRange;
      this.createJSONRangeObject(highLowerRange, medUpperRange, medLowerRange, lowUpperRange)
      swal.fire({
        type: 'success',
        title: "Workload Range Set",

      }).then(() => {

        // this.dialog.closeAll();
      }

      )
    }
  }

  onSubmitSprint() {
    console.log(this.project.default);
    var currWorkload = 0;
    const totalSprintLen = this.project.default.sprints.length;
    for (var i = 0; i < this.currentSprint.userStories.length; i++) {
      var totalPV = 0;
      var totalEV = 0;
      var totalAC = 0;
      for (var j = 0; j < this.currentSprint.userStories[i].tasks.length; j++) {
        currWorkload += this.currentSprint.userStories[i].tasks[j].PV;
        totalPV += this.currentSprint.userStories[i].tasks[j].PV;
        totalEV += this.currentSprint.userStories[i].tasks[j].EV;
        totalAC += this.currentSprint.userStories[i].tasks[j].AC;
      }
      this.project.default.sprints[totalSprintLen - 1].userStories[i].totalPV = totalPV;
      this.project.default.sprints[totalSprintLen - 1].userStories[i].totalEV = totalEV;
      this.project.default.sprints[totalSprintLen - 1].userStories[i].totalAC = totalAC;
    }
    this.project.default.sprints[totalSprintLen - 1].totalPV = currWorkload;
    console.log(this.project.default)

    var emptySprint = {
      "sprintNum": this.currentSprint.sprintNum + 1,
      "totalPV": 0,
      "userStories": []
    }
    this.project.default.sprints.push(emptySprint);
    localStorage.setItem(this.projectId, JSON.stringify(this.project));
    swal.fire({
      type: 'success',
      title: "Sprint Completed",

    }).then(() => {

      // this.dialog.closeAll();
    }

    )
    this.ngOnInit();
  }

  onSaveValue() {
    if (this.editValueForm.valid) {
      const AC = this.editValueForm.value.ac;
      const EV = this.editValueForm.value.ev;
      const latestSprint = this.project.default.sprints.length;
      const userStoryIndex = this.project.default.sprints[latestSprint - 1].userStories.indexOf(this.selectedUserStory);
      const taskIndex = this.project.default.sprints[latestSprint - 1].userStories[userStoryIndex].tasks.indexOf(this.task);
      this.project.default.sprints[latestSprint - 1].userStories[userStoryIndex].tasks[taskIndex].AC = AC;
      this.project.default.sprints[latestSprint - 1].userStories[userStoryIndex].tasks[taskIndex].EV = EV;
      localStorage.setItem(this.projectId, JSON.stringify(this.project))
      this.closeEdit();
      swal.fire({
        type: 'success',
        title: "Task Saved",

      }).then(() => {

        // this.dialog.closeAll();
      }

      )
    }
  }

  createJSONRangeObject(hl: number, mu: number, ml: number, lu: number) {
    var range = {
      "higherLower": hl,
      "medUpper": mu,
      "medLower": ml,
      "lowerUpper": lu,
    }
    console.log(range);
    this.closeSetRange();
    localStorage.setItem("range", JSON.stringify(range));
  }

  createJSONTaskObject(taskName: any, pv: any, userStory: any) {
    var newTask =
    {
      "description": taskName,
      "EV": 0,
      "AC": 0,
      "PV": pv

    }
    const latestSprint = this.project.default.sprints.length;
    const userStoryIndex = this.project.default.sprints[latestSprint - 1].userStories.indexOf(userStory);
    this.project.default.sprints[latestSprint - 1].userStories[userStoryIndex].tasks.push(newTask);
    console.log(this.project.default.sprints[latestSprint - 1].userStories[userStoryIndex].tasks)
    localStorage.setItem(this.projectId, JSON.stringify(this.project));
  }
}
