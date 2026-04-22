import { redirect } from 'next/navigation';

export default function InvestorFlowRedirect() {
  redirect('/net-buy?tab=flow');
}
