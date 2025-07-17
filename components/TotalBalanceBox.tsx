import { formatAmount } from '@/lib/utils'
import React from 'react'
import AnimatedCounter from './AnimatedCounter'
import DoughnutChart from './DoughnutChart'

const TotalBalanceBox = ({
    accounts = [], 
    totalBanks, totalCurrentBalance
}: TotlaBalanceBoxProps) => {
  return (
    <section className='total-balance'>
        <div className='total-balance-chart'>
            {/* Doughnut chart */}
            <DoughnutChart accounts={accounts} />
        </div>

        <div className='flex flex-col gap-6 flex-1'>
            <h2 className='header-2'>
                Banks Accounts: {totalBanks} 
            </h2>

            <div className='flex flex-col gap-2'>
                <p className='toal-balance-label'>Total Current Balance</p>

                <div className='total-balance-amount  gap-2'>
                    <AnimatedCounter amount={totalCurrentBalance}/>
                </div>
            </div>
        </div>
    </section>
  )
}

export default TotalBalanceBox