import { ReportRepository } from './repositories/ReportRepository.ts'

export class ReportService {
  private repo = new ReportRepository()

  async getDailySales(days = 14) {
    return this.repo.getSalesByPeriod('day', days)
  }

  async getWeeklySales(weeks = 8) {
    return this.repo.getSalesByPeriod('week', weeks * 7)
  }

  async getMonthlySales(months = 6) {
    return this.repo.getSalesByPeriod('month', months * 30)
  }

  async getProfitReport(days = 30) {
    return this.repo.getProfitReport(days)
  }

  async getInventoryReport() {
    return this.repo.getInventoryReport()
  }

  async getFastMovingProducts(limit = 10) {
    const { fast } = await this.repo.getProductVelocity(limit)
    return fast
  }

  async getSlowMovingProducts(limit = 10) {
    const { slow } = await this.repo.getProductVelocity(limit)
    return slow
  }
}
