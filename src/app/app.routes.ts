import { Routes } from '@angular/router';
import { PaintingsComponent } from './painting/paintings/paintings.component';
import { HomeComponent } from './home/home.component';
import { PaintingDetailsComponent } from './painting/paintingdetail/paintingdetail.component';
import { AboutMeComponent } from './aboutme/aboutme.component';
import { GalleryComponent } from './gallery/gallery.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { CheckoutComponent } from './painting/checkout/checkout.component';
import { PaymentComponent } from './painting/payment/payment.component';
import { ConfirmpaymentComponent } from './painting/confirmpayment/confirmpayment.component';
import { PrintsComponent } from './print/prints/prints.component';
import { PrintdetailComponent } from './print/printdetail/printdetail.component';
import { CommissionsComponent } from './commissions/commissions.component';
import { WorkshopsComponent } from './workshop/workshops/workshops.component';
import { WorkshopDetailComponent } from './workshop/workshopdetail/workshopdetail.component';
import { WsregistrationComponent } from './workshop/wsregistration/wsregistration.component';
import { RegistrationpaymentComponent } from './workshop/registrationpayment/registrationpayment.component';
import { RecordingsComponent } from './recording/recordings/recordings.component';
import { RecordingdetailComponent } from './recording/recordingdetail/recordingdetail.component';
import { RecregistrationComponent } from './recording/recregistration/recregistration.component';
import { RecordingplayComponent } from './recording/recordingplay/recordingplay.component';
import { ContactComponent } from './contact/contact.component';
import { RecordingBundleComponent } from './recording-bundles/recording-bundle/recording-bundle.component';
import { BundleregistrationComponent } from './recording-bundles/bundleregistration/bundleregistration.component';
import { CollaborationsComponent } from './collabs/collaborations/collaborations.component';
import { CollabdetailComponent } from './collabs/collabdetail/collabdetail.component';

export const routes: Routes = [

{ path: '', component: HomeComponent}, // default route
  { path: 'originals', component: PaintingsComponent },
  { path: 'originals/:id', component: PaintingDetailsComponent },
  {path: 'about-ummehani', component: AboutMeComponent}, 
  {path: 'gallery', component: GalleryComponent},
  {path: 'write-a-review', component: ReviewsComponent},
  {path: 'checkout', component: CheckoutComponent},
  {path: 'payment', component: PaymentComponent},
  {path: 'payment-confirmation', component: ConfirmpaymentComponent},
  {path: 'prints', component: PrintsComponent},
  {path: 'prints/:id', component: PrintdetailComponent},
  {path: 'commissions', component: CommissionsComponent},
  {path: 'workshops', component: WorkshopsComponent},
  {path: 'workshops/:id', component: WorkshopDetailComponent},
  {path: 'workshopregistration', component: WsregistrationComponent},
  {path: 'registrationpayment', component: RegistrationpaymentComponent},
  // {path: 'recordings', component: RecordingsComponent},
  {path: 'recordings/:id', component: RecordingdetailComponent},
  {path: 'recordingregistration', component: RecregistrationComponent},
  {path: 'recordingaccess/:id', component: RecordingplayComponent},
  {path: 'contact', component: ContactComponent},
  {path: 'recording-bundle/:id', component: RecordingBundleComponent},
  {path: 'bundleregistration', component: BundleregistrationComponent},
  {path: 'collaborations', component: CollaborationsComponent},
  {path: 'collaborations/:id', component: CollabdetailComponent},

  {
    path: 'admin_ummehani@786110',
    loadChildren: () => import('././admin/admin.module').then(m => m.AdminModule)
  }
];
