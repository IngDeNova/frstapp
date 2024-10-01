import React, { useState, useEffect } from 'react';
import { PlusCircle, ChevronDown, ChevronRight, Calendar, AlertCircle, Save, Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Timeline = ({ tasks }) => {
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const startDate = new Date(Math.min(...sortedTasks.map(t => new Date(t.startDate))));
  const endDate = new Date(Math.max(...sortedTasks.map(t => new Date(t.endDate))));
  const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

  return (
    <div className="mt-4 p-2 border rounded">
      <h3 className="text-lg font-semibold mb-2">Timeline</h3>
      <div className="relative h-[100px]">
        {sortedTasks.map((task, index) => {
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.endDate);
          const left = ((taskStart - startDate) / (1000 * 60 * 60 * 24)) / totalDays * 100;
          const width = ((taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1) / totalDays * 100;
          return (
            <TooltipProvider key={task.id}>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={`absolute h-6 rounded ${getPriorityColor(task.priority)} opacity-75`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      top: `${index * 20}px`
                    }}
                  ></div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.name}</p>
                  <p>Dal {task.startDate} al {task.endDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

const Task = ({ task, project, updateTaskField, renderDependencies }) => {
  return (
    <li className="flex items-center mb-2 p-2 border rounded">
      <Input
        type="text"
        value={task.name}
        onChange={(e) => updateTaskField(project.id, task.id, 'name', e.target.value)}
        className="flex-grow mr-2"
      />
      <Select 
        value={task.priority} 
        onValueChange={(value) => updateTaskField(project.id, task.id, 'priority', value)}
      >
        <SelectTrigger className={`w-[100px] mr-2 ${getPriorityColor(task.priority)}`}>
          <SelectValue placeholder="Priorità" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alta">Alta</SelectItem>
          <SelectItem value="media">Media</SelectItem>
          <SelectItem value="bassa">Bassa</SelectItem>
        </SelectContent>
      </Select>
      <DatePicker
        selected={task.startDate}
        onChange={(date) => updateTaskField(project.id, task.id, 'startDate', date)}
        placeholderText="Inizio"
        className="mr-2"
      />
      <DatePicker
        selected={task.endDate}
        onChange={(date) => updateTaskField(project.id, task.id, 'endDate', date)}
        placeholderText="Fine"
        className="mr-2"
      />
      <Input
        type="text"
        value={task.assignedTo}
        onChange={(e) => updateTaskField(project.id, task.id, 'assignedTo', e.target.value)}
        placeholder="Assegnato a"
        className="w-[150px] mr-2"
      />
      {renderDependencies(project, task)}
    </li>
  );
};

const Project = ({ project, expandedProjects, toggleProjectExpansion, updateProjectDates, addTask, updateTaskField, renderDependencies }) => {
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => toggleProjectExpansion(project.id)}
        >
          {expandedProjects[project.id] ? <ChevronDown /> : <ChevronRight />}
        </Button>
        <h2 className="text-xl font-semibold flex-grow">{project.name}</h2>
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4" />
          <DatePicker
            selected={project.startDate}
            onChange={(date) => updateProjectDates(project.id, date, project.endDate)}
            placeholderText="Data inizio"
            className="mr-2"
          />
          <DatePicker
            selected={project.endDate}
            onChange={(date) => updateProjectDates(project.id, project.startDate, date)}
            placeholderText="Data fine"
          />
        </div>
      </CardHeader>
      {expandedProjects[project.id] && (
        <CardContent>
          <Button onClick={() => addTask(project.id)} className="mb-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Attività
          </Button>
          <ul>
            {project.tasks.map(task => (
              <Task 
                key={task.id}
                task={task}
                project={project}
                updateTaskField={updateTaskField}
                renderDependencies={renderDependencies}
              />
            ))}
          </ul>
          <Timeline tasks={project.tasks} />
        </CardContent>
      )}
    </Card>
  );
};

const ProjectManagementDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState('');
  const [expandedProjects, setExpandedProjects] = useState({});
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
    updateReminders();
  }, []);

  useEffect(() => {
    updateReminders();
  }, [projects]);

  const updateReminders = () => {
    const newReminders = [];
    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.endDate) {
          const dueDate = new Date(task.endDate);
          const today = new Date();
          const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue <= 7 && daysUntilDue > 0) {
            newReminders.push({
              projectName: project.name,
              taskName: task.name,
              dueDate: task.endDate,
              daysUntilDue
            });
          }
        }
      });
    });
    setReminders(newReminders);
  };

  const saveProjects = () => {
    localStorage.setItem('projects', JSON.stringify(projects));
    updateReminders();
  };

  const addProject = () => {
    if (newProject.trim() !== '') {
      const newProjectObj = { 
        id: Date.now(), 
        name: newProject, 
        tasks: [],
        startDate: null,
        endDate: null
      };
      setProjects([...projects, newProjectObj]);
      setNewProject('');
      saveProjects();
    }
  };

  const addTask = (projectId) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { ...project, tasks: [...project.tasks, { 
            id: Date.now(), 
            name: 'Nuova attività', 
            dependencies: [],
            priority: 'media',
            startDate: null,
            endDate: null,
            assignedTo: ''
          }] }
        : project
    ));
    saveProjects();
  };

  const toggleProjectExpansion = (projectId) => {
    setExpandedProjects({
      ...expandedProjects,
      [projectId]: !expandedProjects[projectId]
    });
  };

  const updateTaskField = (projectId, taskId, field, value) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            tasks: project.tasks.map(task => 
              task.id === taskId ? { ...task, [field]: value } : task
            )
          }
        : project
    ));
    saveProjects();
  };

  const updateProjectDates = (projectId, startDate, endDate) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { ...project, startDate, endDate }
        : project
    ));
    saveProjects();
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'alta': return 'text-red-500';
      case 'media': return 'text-yellow-500';
      case 'bassa': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const renderDependencies = (project, task) => {
    return (
      <Select 
        value={task.dependencies.join(',')} 
        onValueChange={(value) => updateTaskField(project.id, task.id, 'dependencies', value.split(','))}
        multiple
      >
        <SelectTrigger className="w-[200px] mr-2">
          <SelectValue placeholder="Dipendenze" />
        </SelectTrigger>
        <SelectContent>
          {project.tasks.filter(t => t.id !== task.id).map(t => (
            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderReminders = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {reminders.length > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 py-1 text-xs">
              {reminders.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <h3 className="font-semibold mb-2">Promemoria</h3>
        {reminders.length === 0 ? (
          <p>Nessun promemoria per i prossimi 7 giorni.</p>
        ) : (
          <ul className="space-y-2">
            {reminders.map((reminder, index) => (
              <li key={index} className="text-sm">
                <span className="font-semibold">{reminder.taskName}</span> in {reminder.projectName}
                <br />Scadenza tra {reminder.daysUntilDue} giorni ({reminder.dueDate})
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard Gestione Progetti</h1>
        {renderReminders()}
      </div>
      <div className="flex mb-4">
        <Input
          type="text"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          placeholder="Nome del nuovo progetto"
          className="flex-grow mr-2"
        />
        <Button onClick={addProject}>
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Progetto
        </Button>
        <Button onClick={saveProjects} className="ml-2">
          <Save className="mr-2 h-4 w-4" /> Salva Progetti
        </Button>
      </div>
      {projects.map(project => (
        <Project
          key={project.id}
          project={project}
          expandedProjects={expandedProjects}
          toggleProjectExpansion={toggleProjectExpansion}
          updateProjectDates={updateProjectDates}
          addTask={addTask}
          updateTaskField={updateTaskField}
          renderDependencies={renderDependencies}
        />
      ))}
    </div>
  );
};

export default ProjectManagementDashboard;
