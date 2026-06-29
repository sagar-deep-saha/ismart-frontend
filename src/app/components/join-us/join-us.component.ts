import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-join-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './join-us.component.html'
})
export class JoinUsComponent implements OnInit {
  joinForm!: FormGroup;
  currentStep = 1;
  totalSteps = 5;
  isSubmitted = false;
  isSaving = false;
  referenceNumber = '';
  isCopied = false;

  // Tripura districts list
  districts = [
    'Dhalai',
    'Gomati',
    'Khowai',
    'Sipahijala',
    'Unakoti',
    'North Tripura',
    'South Tripura',
    'West Tripura'
  ];

  // Business sectors
  sectors = [
    'Agriculture / Farming',
    'Food Processing',
    'Handicraft / Weaving',
    'Retail / Shop',
    'Services (tailoring, beauty, repair etc.)',
    'Digital / Tech',
    'Health & Wellness',
    'Education',
    'Other'
  ];

  // File upload state variables
  uploadedFileName: string | null = null;
  uploadedFileError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.joinForm = this.fb.group({
      // Step 1: Team Overview
      teamName: ['', Validators.required],
      teamTagline: [''],
      memberCount: [1, [Validators.required, Validators.min(1)]],
      formedSince: [''],
      registrationStatus: ['', Validators.required],

      // Step 2: Primary Contact (Team Lead Details)
      leadName: ['', Validators.required],
      leadRole: ['', Validators.required],
      leadAge: ['', [Validators.required, Validators.min(15), Validators.max(100)]],
      leadGender: ['', Validators.required],
      leadPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      leadWhatsappSame: [true],
      leadWhatsapp: ['', Validators.pattern('^[0-9]{10}$')],
      leadEmail: ['', [Validators.email]],
      leadDistrict: ['', Validators.required],
      leadBlock: ['', Validators.required],
      leadVillage: ['', Validators.required],
      leadEducation: ['', Validators.required],
      leadGroups: this.fb.group({
        sc: [false],
        st: [false],
        bpl: [false],
        differentlyAbled: [false],
        singleWoman: [false],
        none: [false]
      }),

      // Step 3: Other Team Members
      hasOtherMembers: ['no', Validators.required],
      members: this.fb.array([]),

      // Step 4: Business / Idea Details
      sector: ['', Validators.required],
      stage: ['', Validators.required],
      durationWorking: ['', Validators.required],
      monthlyRevenue: ['', Validators.required],
      description: [''],
      problemSolved: [''],
      targetCustomers: [''],

      // Step 5: Support & Submit Details
      supportTypes: this.fb.group({
        training: [false],
        funding: [false],
        legal: [false],
        market: [false],
        mentorship: [false],
        tech: [false],
        government: [false],
        coworking: [false],
        partnership: [false],
        other: [false]
      }),
      prevGovSupport: ['no', Validators.required],
      prevGovSupportDetails: [''],
      deviceAccess: ['', Validators.required],
      languages: this.fb.group({
        bengali: [false],
        english: [false],
        hindi: [false],
        kokborok: [false]
      }),
      howHeard: ['', Validators.required],
      preferredContactTime: ['', Validators.required],
      pitchDeckFile: [null],
      additionalMessage: [''],
      consent: [false, Validators.requiredTrue]
    });

    // Reactive subscriptions to dynamically adjust validators/fields
    this.joinForm.get('hasOtherMembers')?.valueChanges.subscribe(val => {
      if (val === 'yes' && this.members.length === 0) {
        this.addMember();
      } else if (val === 'no') {
        this.members.clear();
      }
    });

    this.joinForm.get('leadWhatsappSame')?.valueChanges.subscribe(val => {
      const whatsappCtrl = this.joinForm.get('leadWhatsapp');
      if (val) {
        whatsappCtrl?.clearValidators();
        whatsappCtrl?.setValue('');
      } else {
        whatsappCtrl?.setValidators([Validators.required, Validators.pattern('^[0-9]{10}$')]);
      }
      whatsappCtrl?.updateValueAndValidity();
    });

    this.joinForm.get('prevGovSupport')?.valueChanges.subscribe(val => {
      const detailsCtrl = this.joinForm.get('prevGovSupportDetails');
      if (val === 'yes') {
        detailsCtrl?.setValidators([Validators.required]);
      } else {
        detailsCtrl?.clearValidators();
        detailsCtrl?.setValue('');
      }
      detailsCtrl?.updateValueAndValidity();
    });
  }

  // Getters for form controls
  get members(): FormArray {
    return this.joinForm.get('members') as FormArray;
  }

  get f() {
    return this.joinForm.controls;
  }

  // Member array management
  addMember() {
    if (this.members.length < 10) {
      const memberGroup = this.fb.group({
        name: ['', Validators.required],
        role: ['', Validators.required],
        age: [''],
        gender: [''],
        phone: ['', Validators.pattern('^[0-9]{10}$')],
        education: [''],
        groups: this.fb.group({
          sc: [false],
          st: [false],
          bpl: [false],
          differentlyAbled: [false],
          singleWoman: [false],
          none: [false]
        })
      });
      this.members.push(memberGroup);
    }
  }

  removeMember(index: number) {
    this.members.removeAt(index);
    if (this.members.length === 0) {
      this.joinForm.get('hasOtherMembers')?.setValue('no', { emitEvent: false });
    }
  }

  // Step validation helpers
  isStepValid(step: number): boolean {
    const controls = this.getStepControlNames(step);
    let isValid = true;
    for (const ctrlName of controls) {
      const control = this.joinForm.get(ctrlName);
      if (control && control.invalid) {
        isValid = false;
      }
    }

    if (step === 3) {
      const hasOthers = this.joinForm.get('hasOtherMembers')?.value;
      if (hasOthers === 'yes') {
        if (this.members.invalid) {
          isValid = false;
        }
      }
    }

    if (step === 5) {
      const supportGroup = this.joinForm.get('supportTypes') as FormGroup;
      const anySupportChecked = Object.values(supportGroup.value).some(val => val === true);
      
      const langGroup = this.joinForm.get('languages') as FormGroup;
      const anyLangChecked = Object.values(langGroup.value).some(val => val === true);
      
      const consentCtrl = this.joinForm.get('consent');

      if (!anySupportChecked || !anyLangChecked || (consentCtrl && consentCtrl.invalid)) {
        isValid = false;
      }
    }

    return isValid;
  }

  getStepControlNames(step: number): string[] {
    switch (step) {
      case 1:
        return ['teamName', 'teamTagline', 'memberCount', 'formedSince', 'registrationStatus'];
      case 2:
        return ['leadName', 'leadRole', 'leadAge', 'leadGender', 'leadPhone', 'leadWhatsappSame', 'leadWhatsapp', 'leadEmail', 'leadDistrict', 'leadBlock', 'leadVillage', 'leadEducation'];
      case 3:
        return ['hasOtherMembers'];
      case 4:
        return ['sector', 'stage', 'durationWorking', 'monthlyRevenue', 'description', 'problemSolved', 'targetCustomers'];
      case 5:
        return ['prevGovSupport', 'prevGovSupportDetails', 'deviceAccess', 'howHeard', 'preferredContactTime'];
      default:
        return [];
    }
  }

  // Check if any support error or language error should be displayed in Step 5
  isSupportInvalid(): boolean {
    const supportGroup = this.joinForm.get('supportTypes') as FormGroup;
    const touched = Object.values(supportGroup.controls).some(ctrl => ctrl.touched);
    if (!touched) return false;
    return !Object.values(supportGroup.value).some(val => val === true);
  }

  isLanguageInvalid(): boolean {
    const langGroup = this.joinForm.get('languages') as FormGroup;
    const touched = Object.values(langGroup.controls).some(ctrl => ctrl.touched);
    if (!touched) return false;
    return !Object.values(langGroup.value).some(val => val === true);
  }

  // Navigation methods
  nextStep() {
    this.markStepControlsAsTouched(this.currentStep);
    
    if (this.isStepValid(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.scrollToFormTop();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.scrollToFormTop();
    }
  }

  goToStep(stepNum: number) {
    // Only allow clicking to steps that are before the current step, or to the next step if current is valid
    if (stepNum < this.currentStep) {
      this.currentStep = stepNum;
      this.scrollToFormTop();
    } else if (stepNum === this.currentStep + 1 && this.isStepValid(this.currentStep)) {
      this.currentStep = stepNum;
      this.scrollToFormTop();
    }
  }

  scrollToFormTop() {
    const element = document.getElementById('join-us-form-card');
    if (element) {
      const offset = 100; // Account for fixed navbar height (80px) + 20px padding
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({ top: 150, behavior: 'smooth' });
    }
  }

  markStepControlsAsTouched(step: number) {
    const controls = this.getStepControlNames(step);
    for (const ctrlName of controls) {
      const control = this.joinForm.get(ctrlName);
      if (control) {
        control.markAsTouched();
      }
    }

    if (step === 3) {
      this.members.controls.forEach(grp => {
        const fg = grp as FormGroup;
        Object.values(fg.controls).forEach(ctrl => ctrl.markAsTouched());
      });
    }

    if (step === 5) {
      const supportGroup = this.joinForm.get('supportTypes') as FormGroup;
      Object.values(supportGroup.controls).forEach(ctrl => ctrl.markAsTouched());
      
      const langGroup = this.joinForm.get('languages') as FormGroup;
      Object.values(langGroup.controls).forEach(ctrl => ctrl.markAsTouched());

      const consentCtrl = this.joinForm.get('consent');
      consentCtrl?.markAsTouched();
    }
  }

  // File Upload Handlers
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.uploadedFileError = 'Only PDF files are supported.';
        this.uploadedFileName = null;
        this.joinForm.get('pitchDeckFile')?.setValue(null);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.uploadedFileError = 'File size must be less than 5MB.';
        this.uploadedFileName = null;
        this.joinForm.get('pitchDeckFile')?.setValue(null);
        return;
      }

      this.uploadedFileError = null;
      this.uploadedFileName = file.name;
      this.joinForm.get('pitchDeckFile')?.setValue(file);
    }
  }

  removeUploadedFile(fileInput: HTMLInputElement) {
    fileInput.value = '';
    this.uploadedFileName = null;
    this.uploadedFileError = null;
    this.joinForm.get('pitchDeckFile')?.setValue(null);
  }

  // Form submission
  onSubmit() {
    this.markStepControlsAsTouched(5);
    
    if (this.isStepValid(5) && this.joinForm.valid) {
      this.isSaving = true;
      const val = this.joinForm.value;

      // Extract lead member groups
      const leadGroupsObj = val.leadGroups || {};
      const lead_member_groups: string[] = [];
      if (leadGroupsObj.sc) lead_member_groups.push('sc');
      if (leadGroupsObj.st) lead_member_groups.push('st');
      if (leadGroupsObj.bpl) lead_member_groups.push('bpl');
      if (leadGroupsObj.differentlyAbled) lead_member_groups.push('differently_abled');
      if (leadGroupsObj.singleWoman) lead_member_groups.push('single_woman');

      // Support Types translation
      const supportObj = val.supportTypes || {};
      const support_types: string[] = [];
      if (supportObj.training) support_types.push('training');
      if (supportObj.funding) support_types.push('funding');
      if (supportObj.legal) support_types.push('legal_help');
      if (supportObj.market) support_types.push('market_linkage');
      if (supportObj.mentorship) support_types.push('mentorship');
      if (supportObj.tech) support_types.push('technology');
      if (supportObj.government) support_types.push('government_scheme');
      if (supportObj.coworking) support_types.push('infrastructure');
      if (supportObj.partnership) support_types.push('partnership');
      if (supportObj.other) support_types.push('other');

      // Languages
      const langObj = val.languages || {};
      const languages: string[] = [];
      if (langObj.bengali) languages.push('bengali');
      if (langObj.english) languages.push('english');
      if (langObj.hindi) languages.push('hindi');
      if (langObj.kokborok) languages.push('kokborok');

      // Construct FormData payload
      const formData = new FormData();
      formData.append('team_name', val.teamName);
      formData.append('tagline', val.teamTagline || '');
      formData.append('formed_since', val.formedSince || '');
      formData.append('registration_status', val.registrationStatus);
      formData.append('prev_gov_support', val.prevGovSupport === 'yes' ? '1' : '0');
      formData.append('prev_gov_support_details', val.prevGovSupportDetails || '');
      formData.append('device_access', val.deviceAccess);
      formData.append('how_heard', val.howHeard || '');
      formData.append('preferred_contact_time', val.preferredContactTime || '');
      formData.append('additional_message', val.additionalMessage || '');
      formData.append('consent', val.consent ? '1' : '0');

      if (val.pitchDeckFile) {
        formData.append('pitch_deck', val.pitchDeckFile);
      }

      formData.append('business_sector', val.sector || '');
      formData.append('business_stage', val.stage || '');
      formData.append('business_duration_working', val.durationWorking || '');
      formData.append('business_monthly_revenue', val.monthlyRevenue || '');
      formData.append('business_description', val.description || '');
      formData.append('business_problem_solved', val.problemSolved || '');
      formData.append('business_target_customers', val.targetCustomers || '');

      formData.append('lead_name', val.leadName);
      formData.append('lead_role', val.leadRole);
      if (val.leadAge) formData.append('lead_age', String(val.leadAge));
      formData.append('lead_gender', val.leadGender || '');
      formData.append('lead_phone', val.leadPhone || '');

      const whatsappNum = val.leadWhatsappSame ? val.leadPhone : val.leadWhatsapp;
      formData.append('lead_whatsapp_number', whatsappNum || '');
      formData.append('lead_email', val.leadEmail || '');
      formData.append('lead_education', val.leadEducation || '');
      formData.append('lead_district', val.leadDistrict || '');
      formData.append('lead_block', val.leadBlock || '');
      formData.append('lead_village', val.leadVillage || '');

      lead_member_groups.forEach(g => {
        formData.append('lead_member_groups[]', g);
      });

      support_types.forEach(s => {
        formData.append('support_types[]', s);
      });

      languages.forEach(l => {
        formData.append('languages[]', l);
      });

      if (val.members && val.members.length > 0) {
        val.members.forEach((m: any, idx: number) => {
          formData.append(`members[${idx}][name]`, m.name);
          formData.append(`members[${idx}][role]`, m.role);
          if (m.age) formData.append(`members[${idx}][age]`, String(m.age));
          formData.append(`members[${idx}][gender]`, m.gender || '');
          formData.append(`members[${idx}][phone]`, m.phone || '');
          formData.append(`members[${idx}][whatsapp_number]`, m.phone || '');
          formData.append(`members[${idx}][email]`, m.email || '');
          formData.append(`members[${idx}][education]`, m.education || '');
          formData.append(`members[${idx}][district]`, val.leadDistrict || '');
          formData.append(`members[${idx}][block]`, val.leadBlock || '');
          formData.append(`members[${idx}][village]`, val.leadVillage || '');

          const mGroupsObj = m.groups || {};
          if (mGroupsObj.sc) formData.append(`members[${idx}][member_groups][]`, 'sc');
          if (mGroupsObj.st) formData.append(`members[${idx}][member_groups][]`, 'st');
          if (mGroupsObj.bpl) formData.append(`members[${idx}][member_groups][]`, 'bpl');
          if (mGroupsObj.differentlyAbled) formData.append(`members[${idx}][member_groups][]`, 'differently_abled');
          if (mGroupsObj.singleWoman) formData.append(`members[${idx}][member_groups][]`, 'single_woman');
        });
      }

      this.http.post<{ success: boolean; message: string; data: { reference_number: string } }>(
        'http://192.168.1.57:8004/api/join',
        formData
      ).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.referenceNumber = res.data.reference_number;
          this.isSubmitted = true;
          this.scrollToFormTop();
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Failed to submit application:', err);
          alert(err.error?.message || err.error?.error || 'Failed to submit application. Please check form inputs and try again.');
        }
      });
    } else {
      // If there are errors, find the first invalid step and jump to it
      for (let s = 1; s <= 5; s++) {
        if (!this.isStepValid(s)) {
          this.currentStep = s;
          this.markStepControlsAsTouched(s);
          this.scrollToFormTop();
          break;
        }
      }
    }
  }

  resetForm() {
    this.joinForm.reset({
      memberCount: 1,
      hasOtherMembers: 'no',
      leadWhatsappSame: true,
      prevGovSupport: 'no',
      consent: false
    });
    this.members.clear();
    this.currentStep = 1;
    this.isSubmitted = false;
    this.uploadedFileName = null;
    this.uploadedFileError = null;
    this.referenceNumber = '';
  }

  copyLinkToClipboard() {
    if (!this.referenceNumber) return;
    navigator.clipboard.writeText(this.referenceNumber).then(() => {
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
      }, 2000);
    }).catch(err => {
      console.error('Could not copy reference number: ', err);
    });
  }
}
