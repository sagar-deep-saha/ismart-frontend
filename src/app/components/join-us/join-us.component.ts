import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-join-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './join-us.component.html'
})
export class JoinUsComponent implements OnInit {
  joinForm!: FormGroup;
  currentStep = 1;
  totalSteps = 2;
  isSubmitted = false;
  isSaving = false;
  referenceNumber = '';
  isCopied = false;
  whatsappLink = 'https://wa.me/919101378960';

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

  // Business stages
  stages = [
    { value: 'idea', label: 'Idea Stage', desc: 'Concept or project planning phase' },
    { value: 'mvp', label: 'MVP Stage', desc: 'Prototype or minimum viable product ready' },
    { value: 'early_traction', label: 'Early Traction', desc: 'Starting to get customers/revenue' },
    { value: 'scaling', label: 'Scaling', desc: 'Established and growing the business' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.fetchWhatsAppLink();
    this.joinForm = this.fb.group({
      // Step 1: Founder & Team Info
      teamName: ['', Validators.required],
      registrationStatus: ['', Validators.required],
      leadName: ['', Validators.required],
      leadPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      leadEmail: ['', [Validators.email]],
      leadDistrict: ['', Validators.required],
      workingStatus: ['solo', Validators.required],
      teamSize: [1, [Validators.min(1)]],

      // Step 2: Business details
      sector: ['', Validators.required],
      stage: ['', Validators.required],
      description: [''],

      // Support Checklist
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

      consent: [false, Validators.requiredTrue]
    });

    // Automatically set teamSize to 1 if workingStatus is solo
    this.joinForm.get('workingStatus')?.valueChanges.subscribe(status => {
      if (status === 'solo') {
        this.joinForm.get('teamSize')?.setValue(1);
      }
    });
  }

  fetchWhatsAppLink() {
    this.http.get<{ success: boolean; data: any }>('http://192.168.1.57:8004/api/settings/contact').subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.whatsapp_link) {
          this.whatsappLink = res.data.whatsapp_link;
        }
      },
      error: (err) => {
        console.error('Failed to load whatsapp link', err);
      }
    });
  }

  get f() {
    return this.joinForm.controls;
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

    if (step === 2) {
      const consentCtrl = this.joinForm.get('consent');
      if (consentCtrl && consentCtrl.invalid) {
        isValid = false;
      }
    }

    return isValid;
  }

  getStepControlNames(step: number): string[] {
    switch (step) {
      case 1:
        return ['teamName', 'registrationStatus', 'leadName', 'leadPhone', 'leadEmail', 'leadDistrict', 'workingStatus', 'teamSize'];
      case 2:
        return ['sector', 'stage', 'description'];
      default:
        return [];
    }
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
      const offset = 100;
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

    if (step === 2) {
      const consentCtrl = this.joinForm.get('consent');
      consentCtrl?.markAsTouched();
    }
  }



  // Form submission
  onSubmit() {
    this.markStepControlsAsTouched(2);
    
    if (this.isStepValid(2) && this.joinForm.valid) {
      this.isSaving = true;
      const val = this.joinForm.value;

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

      // Construct FormData payload
      const formData = new FormData();
      
      // Step 1: Team & Contact Info
      formData.append('team_name', val.teamName);
      formData.append('registration_status', val.registrationStatus);
      formData.append('lead_name', val.leadName);
      formData.append('lead_phone', val.leadPhone || '');
      formData.append('lead_whatsapp_number', val.leadPhone || ''); // Same as phone
      formData.append('lead_email', val.leadEmail || '');
      formData.append('lead_district', val.leadDistrict || '');
      
      // Step 2: Business Details
      formData.append('business_sector', val.sector || '');
      formData.append('business_stage', val.stage || '');
      formData.append('business_description', val.description || '');



      // Mandatory / Default Fields required by backend validation
      formData.append('lead_role', 'Founder');
      formData.append('prev_gov_support', '0'); // No previous gov support details
      formData.append('prev_gov_support_details', '');
      formData.append('device_access', 'smartphone');
      formData.append('how_heard', 'Other');
      formData.append('preferred_contact_time', 'Anytime');
      formData.append('additional_message', '');
      formData.append('consent', val.consent ? '1' : '0');

      // Empty lead location details that are not selected
      formData.append('lead_block', '');
      formData.append('lead_village', '');

      support_types.forEach(s => {
        formData.append('support_types[]', s);
      });

      // Send member_count directly to backend
      const memberCount = val.workingStatus === 'team' && val.teamSize > 1 ? val.teamSize : 1;
      formData.append('member_count', memberCount.toString());

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
      // Find the first invalid step and jump to it
      for (let s = 1; s <= 2; s++) {
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
      workingStatus: 'solo',
      teamSize: 1,
      consent: false
    });
    this.currentStep = 1;
    this.isSubmitted = false;
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
