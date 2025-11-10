import { notFound } from 'next/navigation'

import { getDealPublic } from '../../../lib/api-client'
import { PayClient } from '../../../components/pay/pay-client'

type PayPageProps = {
  params: {
    token: string
  }
}

export default async function PayPage({ params }: PayPageProps) {
  try {
    const deal = await getDealPublic(params.token)
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <PayClient deal={deal} paylinkToken={params.token} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
